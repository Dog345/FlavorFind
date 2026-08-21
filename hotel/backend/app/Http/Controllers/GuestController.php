<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\TableSession;
use App\Models\Tenant;
use App\Models\UpsellImpression;
use App\Services\DarajaService;
use App\Services\UpsellService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * GuestController — public endpoints secured by QR session token only.
 *
 * All routes are prefixed /api/v1/guest/{token}/
 * No Sanctum auth required — the token in the URL is the credential.
 *
 * Tenant is resolved from the session token (no X-Tenant-Slug header needed).
 *
 * Endpoints:
 *   GET  /api/v1/guest/{token}                     — resolve session, hotel branding, table info
 *   GET  /api/v1/guest/{token}/menu                — full menu (categories + items)
 *   GET  /api/v1/guest/{token}/menu/search         — search menu items
 *   GET  /api/v1/guest/{token}/popular             — top 10 popular items
 *   POST /api/v1/guest/{token}/orders              — place a new order
 *   GET  /api/v1/guest/{token}/orders/{orderId}    — track order status
 *   GET  /api/v1/guest/{token}/upsell              — upsell suggestions for cart
 *   POST /api/v1/guest/{token}/payments/mpesa      — initiate M-Pesa STK Push
 *   GET  /api/v1/guest/{token}/payments/{paymentId}/status — poll payment status
 */
class GuestController extends Controller
{
    public function __construct(
        private readonly DarajaService $daraja,
        private readonly UpsellService $upsellService,
    ) {
    }

    // ─── 1. Resolve Session ───────────────────────────────────────────────────

    /**
     * GET /api/v1/guest/{token}
     *
     * Validates the QR token and returns:
     *  - Hotel branding (name, logo, colors)
     *  - Table info (label, floor, capacity)
     *  - Session metadata (covers, guest name, status)
     */
    public function resolveSession(string $token): JsonResponse
    {
        $session = $this->findSession($token);

        if (! $session->isOpen()) {
            return response()->json([
                'error' => 'This table session is no longer active. Please ask your waiter.',
            ], 410);
        }

        $tenant = $session->tenant;
        $table  = $session->table;

        return response()->json([
            'session' => [
                'id'         => $session->id,
                'token'      => $session->token,
                'covers'     => $session->covers,
                'guest_name' => $session->guest_name,
                'opened_at'  => $session->opened_at->toIso8601String(),
                'is_open'    => true,
            ],
            'table' => [
                'id'       => $table->id,
                'label'    => $table->label,
                'capacity' => $table->capacity,
                'floor'    => $table->floor?->name,
            ],
            'hotel' => [
                'id'            => $tenant->id,
                'name'          => $tenant->name,
                'slug'          => $tenant->slug,
                'logo_url'      => $tenant->logo_url,
                'primary_color' => $tenant->primary_color ?? '#1a1a2e',
                'currency'      => 'KES',
                'mpesa_paybill' => $tenant->mpesa_paybill,
                'mpesa_till'    => $tenant->mpesa_till,
            ],
        ]);
    }

    // ─── 2. Full Menu ─────────────────────────────────────────────────────────

    /**
     * GET /api/v1/guest/{token}/menu
     *
     * Returns all active categories with their available items.
     * Items include variants and modifiers for the detail sheet.
     * Cached per tenant for 5 minutes to reduce DB load.
     */
    public function menu(string $token): JsonResponse
    {
        $session  = $this->findSession($token);
        $tenantId = $session->tenant_id;

        $categories = Cache::remember("guest_menu_{$tenantId}", 300, function () use ($tenantId) {
            return \App\Models\MenuCategory::forTenant($tenantId)
                ->active()
                ->ordered()
                ->with([
                    'menuItems' => fn ($q) => $q->available()->ordered()->with([
                        'variants:id,menu_item_id,name,price,is_available',
                        'modifiers:id,menu_item_id,name,price_delta,is_available',
                    ]),
                ])
                ->get()
                ->map(fn ($cat) => [
                    'id'          => $cat->id,
                    'name'        => $cat->name,
                    'description' => $cat->description,
                    'image_url'   => $cat->image_url,
                    'items'       => $cat->menuItems->map(fn ($item) => $this->formatItem($item)),
                ]);
        });

        return response()->json(['data' => $categories]);
    }

    // ─── 3. Search Menu ───────────────────────────────────────────────────────

    /**
     * GET /api/v1/guest/{token}/menu/search?q=chicken
     *
     * Full-text search across item name, description, and tags.
     * Min 2 characters required.
     */
    public function searchMenu(Request $request, string $token): JsonResponse
    {
        $session = $this->findSession($token);

        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $q = trim($request->string('q'));

        $items = MenuItem::forTenant($session->tenant_id)
            ->available()
            ->where(function ($query) use ($q) {
                $query->where('name', 'ILIKE', "%{$q}%")
                      ->orWhere('description', 'ILIKE', "%{$q}%")
                      ->orWhereRaw("tags::text ILIKE ?", ["%{$q}%"]);
            })
            ->with([
                'variants:id,menu_item_id,name,price,is_available',
                'modifiers:id,menu_item_id,name,price_delta,is_available',
                'category:id,name',
            ])
            ->ordered()
            ->limit(30)
            ->get()
            ->map(fn ($item) => [
                ...$this->formatItem($item),
                'category_name' => $item->category?->name,
            ]);

        return response()->json([
            'data'  => $items,
            'query' => $q,
            'count' => $items->count(),
        ]);
    }

    // ─── 4. Popular Items ─────────────────────────────────────────────────────

    /**
     * GET /api/v1/guest/{token}/popular
     *
     * Top 10 most ordered items for this hotel (last 30 days).
     * Cached 15 minutes.
     */
    public function popular(string $token): JsonResponse
    {
        $session  = $this->findSession($token);
        $tenantId = $session->tenant_id;

        $items = Cache::remember("guest_popular_{$tenantId}", 900, function () use ($tenantId) {
            $topIds = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.tenant_id', $tenantId)
                ->whereNotIn('orders.status', [Order::STATUS_CANCELLED])
                ->where('orders.created_at', '>=', now()->subDays(30))
                ->selectRaw('order_items.name, SUM(order_items.quantity) AS total_qty')
                ->groupBy('order_items.name')
                ->orderByRaw('total_qty DESC')
                ->limit(10)
                ->pluck('name');

            return MenuItem::forTenant($tenantId)
                ->available()
                ->whereIn('name', $topIds)
                ->with([
                    'variants:id,menu_item_id,name,price,is_available',
                    'modifiers:id,menu_item_id,name,price_delta,is_available',
                    'category:id,name',
                ])
                ->get()
                ->sortBy(fn ($item) => $topIds->search($item->name))
                ->values()
                ->map(fn ($item) => [
                    ...$this->formatItem($item),
                    'category_name' => $item->category?->name,
                    'is_popular'    => true,
                ]);
        });

        return response()->json(['data' => $items]);
    }

    // ─── 5. Place Order ───────────────────────────────────────────────────────

    /**
     * POST /api/v1/guest/{token}/orders
     *
     * Place a new order linked to this table session.
     *
     * Body:
     * {
     *   "items": [
     *     {
     *       "menu_item_id": 1,
     *       "quantity": 2,
     *       "variant_id": null,
     *       "modifier_ids": [3, 5],
     *       "notes": "No onions"
     *     }
     *   ],
     *   "notes": "Order-level note"
     * }
     */
    public function placeOrder(Request $request, string $token): JsonResponse
    {
        $session = $this->findSession($token);

        if (! $session->isOpen()) {
            return response()->json(['error' => 'Session is closed.'], 410);
        }

        $data = $request->validate([
            'items'                     => 'required|array|min:1|max:50',
            'items.*.menu_item_id'      => 'required|string|uuid',
            'items.*.quantity'          => 'required|integer|min:1|max:99',
            'items.*.variant_id'        => 'nullable|string|uuid',
            'items.*.modifier_ids'      => 'nullable|array',
            'items.*.modifier_ids.*'    => 'string|uuid',
            'items.*.notes'             => 'nullable|string|max:200',
            'notes'                     => 'nullable|string|max:500',
        ]);

        $tenantId = $session->tenant_id;

        return DB::transaction(function () use ($data, $session, $tenantId) {
            // Resolve menu items and validate they belong to this tenant
            $menuItemIds = collect($data['items'])->pluck('menu_item_id')->unique();
            $menuItems   = MenuItem::forTenant($tenantId)
                ->available()
                ->whereIn('id', $menuItemIds)
                ->with(['variants', 'modifiers'])
                ->get()
                ->keyBy('id');

            if ($menuItems->count() !== $menuItemIds->count()) {
                return response()->json([
                    'error' => 'One or more items are unavailable or not found.',
                ], 422);
            }

            // Build order number
            $orderNumber = null; // DB trigger assigns this automatically

            // Calculate totals
            $subtotal = 0.0;
            $lineItems = [];

            foreach ($data['items'] as $line) {
                $menuItem  = $menuItems[$line['menu_item_id']];
                $unitPrice = $menuItem->base_price;

                // Add variant price adjustment
                if (! empty($line['variant_id'])) {
                    $variant = $menuItem->variants->firstWhere('id', $line['variant_id']);
                    if ($variant && $variant->is_available) {
                        $unitPrice = $variant->price; // variant has absolute price
                    }
                }

                // Add modifier prices
                $modifierTotal = 0.0;
                if (! empty($line['modifier_ids'])) {
                    foreach ($line['modifier_ids'] as $modId) {
                        $mod = $menuItem->modifiers->firstWhere('id', $modId);
                        if ($mod && $mod->is_available) {
                            $modifierTotal += $mod->price_delta;
                        }
                    }
                }

                $unitPrice += $modifierTotal;
                $lineTotal  = round($unitPrice * $line['quantity'], 2);
                $subtotal  += $lineTotal;

                $lineItems[] = [
                    'menu_item_id' => $menuItem->id,
                    'name'         => $menuItem->name,
                    'quantity'     => $line['quantity'],
                    'unit_price'   => round($unitPrice, 2),
                    'line_total'   => $lineTotal,
                    'notes'        => $line['notes'] ?? null,
                    'status'       => 'pending',
                ];
            }

            $taxRate  = 0.16; // 16% VAT
            $tax      = round($subtotal * $taxRate, 2);
            $total    = round($subtotal + $tax, 2);

            // Create order
            $order = Order::create([
                'tenant_id'    => $tenantId,
                'session_id'   => $session->id,
                'table_id'     => $session->table_id,
                'order_number' => $orderNumber,
                'status'       => Order::STATUS_PENDING,
                'type'         => Order::TYPE_DINE_IN,
                'subtotal'     => $subtotal,
                'tax_amount'   => $tax,
                'discount_amount' => 0,
                'total_amount' => $total,
                'notes'        => $data['notes'] ?? null,
            ]);

            // Create order items
            foreach ($lineItems as $line) {
                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $line['menu_item_id'],
                    'name'         => $line['name'],
                    'quantity'     => $line['quantity'],
                    'unit_price'   => $line['unit_price'],
                    'line_total'   => $line['line_total'],
                    'notes'        => $line['notes'],
                    'status'       => $line['status'],
                ]);
            }

            $order->load('items');

            return response()->json([
                'message' => 'Order placed successfully.',
                'order'   => [
                    'id'           => $order->id,
                    'order_number' => $order->order_number,
                    'status'       => $order->status,
                    'subtotal'     => $order->subtotal,
                    'tax_amount'   => $order->tax_amount,
                    'total_amount' => $order->total_amount,
                    'items'        => $order->items->map(fn ($i) => [
                        'id'         => $i->id,
                        'name'       => $i->name,
                        'quantity'   => $i->quantity,
                        'unit_price' => $i->unit_price,
                        'line_total' => $i->line_total,
                        'status'     => $i->status,
                        'notes'      => $i->notes,
                    ]),
                ],
            ], 201);
        });
    }

    // ─── 6. Track Order ───────────────────────────────────────────────────────

    /**
     * GET /api/v1/guest/{token}/orders/{orderId}
     *
     * Returns order status + per-item statuses.
     * Guest polls this every 15s to show live cooking progress.
     */
    public function trackOrder(string $token, string $orderId): JsonResponse
    {
        $session = $this->findSession($token);

        $order = Order::where('tenant_id', $session->tenant_id)
            ->where('session_id', $session->id)
            ->where('id', $orderId)
            ->with('items')
            ->firstOrFail();

        return response()->json([
            'order' => [
                'id'           => $order->id,
                'order_number' => $order->order_number,
                'status'       => $order->status,
                'status_label' => $this->statusLabel($order->status),
                'subtotal'     => $order->subtotal,
                'tax_amount'   => $order->tax_amount,
                'total_amount' => $order->total_amount,
                'notes'        => $order->notes,
                'created_at'   => $order->created_at->toIso8601String(),
                'items'        => $order->items->map(fn ($i) => [
                    'id'         => $i->id,
                    'name'       => $i->name,
                    'quantity'   => $i->quantity,
                    'unit_price' => $i->unit_price,
                    'line_total' => $i->line_total,
                    'status'     => $i->status,
                    'notes'      => $i->notes,
                ]),
            ],
        ]);
    }

    // ─── 7. Upsell Suggestions ────────────────────────────────────────────────

    /**
     * GET /api/v1/guest/{token}/upsell?item_ids[]=1&item_ids[]=2
     *
     * Returns up to 3 suggested add-ons based on cart contents.
     * Uses the same UpsellService as the staff app.
     */
    public function upsell(Request $request, string $token): JsonResponse
    {
        $session = $this->findSession($token);

        $request->validate([
            'item_ids'   => 'required|array|min:1',
            'item_ids.*' => 'integer',
        ]);

        $suggestions = $this->upsellService->suggest(
            $session->tenant_id,
            $request->input('item_ids', [])
        );

        return response()->json(['data' => $suggestions]);
    }

    // ─── 8. Initiate M-Pesa Payment ──────────────────────────────────────────

    /**
     * POST /api/v1/guest/{token}/payments/mpesa
     *
     * Guest-initiated M-Pesa STK Push for a specific order.
     *
     * Body:
     * {
     *   "order_id": 42,
     *   "phone": "254712345678",
     *   "amount": 1500.00   // optional — defaults to outstanding balance
     * }
     */
    public function initiatePayment(Request $request, string $token): JsonResponse
    {
        $session = $this->findSession($token);

        $data = $request->validate([
            'order_id' => 'required|string|uuid',
            'phone'    => ['required', 'string', 'regex:/^254[0-9]{9}$/'],
            'amount'   => 'nullable|numeric|min:1',
        ]);

        $order = Order::where('tenant_id', $session->tenant_id)
            ->where('session_id', $session->id)
            ->where('id', $data['order_id'])
            ->firstOrFail();

        if ($order->status === Order::STATUS_PAID) {
            return response()->json(['error' => 'Order is already paid.'], 409);
        }

        // Calculate outstanding balance
        $paid        = Payment::where('order_id', $order->id)
            ->where('status', Payment::STATUS_COMPLETED)
            ->sum('amount');
        $outstanding = round($order->total_amount - $paid, 2);

        if ($outstanding <= 0) {
            return response()->json(['error' => 'No outstanding balance.'], 409);
        }

        $amount = isset($data['amount'])
            ? min((float) $data['amount'], $outstanding)
            : $outstanding;

        $payment = Payment::create([
            'tenant_id' => $session->tenant_id,
            'order_id'  => $order->id,
            'method'    => Payment::METHOD_MPESA,
            'status'    => Payment::STATUS_PENDING,
            'amount'    => $amount,
            'phone'     => $data['phone'],
        ]);

        try {
            $response = $this->daraja->stkPush(
                $data['phone'],
                (int) round($amount),
                (string) $order->id
            );

            $payment->update([
                'checkout_request_id' => $response['CheckoutRequestID'] ?? null,
                'merchant_request_id' => $response['MerchantRequestID'] ?? null,
                'metadata'            => $response,
            ]);

            return response()->json([
                'message'             => 'STK Push sent. Check your phone to complete payment.',
                'payment_id'          => $payment->id,
                'checkout_request_id' => $response['CheckoutRequestID'] ?? null,
                'amount'              => $amount,
                'outstanding_after'   => round($outstanding - $amount, 2),
            ], 202);

        } catch (\Exception $e) {
            $payment->update(['status' => Payment::STATUS_FAILED]);

            Log::error('Guest STK Push failed', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Could not initiate M-Pesa payment. Please try again or pay at the till.',
            ], 502);
        }
    }

    // ─── 9. Poll Payment Status ───────────────────────────────────────────────

    /**
     * GET /api/v1/guest/{token}/payments/{paymentId}/status
     *
     * Guest polls this after receiving STK push to know if payment confirmed.
     * Returns: pending | completed | failed
     */
    public function paymentStatus(string $token, string $paymentId): JsonResponse
    {
        $session = $this->findSession($token);

        $payment = Payment::where('tenant_id', $session->tenant_id)
            ->where('id', $paymentId)
            ->firstOrFail();

        // Verify this payment belongs to an order in this session
        $orderBelongsToSession = Order::where('id', $payment->order_id)
            ->where('session_id', $session->id)
            ->exists();

        if (! $orderBelongsToSession) {
            return response()->json(['error' => 'Payment not found.'], 404);
        }

        return response()->json([
            'payment_id' => $payment->id,
            'status'     => $payment->status,
            'amount'     => $payment->amount,
            'method'     => $payment->method,
            'paid_at'    => $payment->paid_at?->toIso8601String(),
            'receipt'    => $payment->mpesa_receipt,
        ]);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /**
     * Find and return a TableSession by token.
     * Aborts with 404 if token is invalid.
     */
    private function findSession(string $token): TableSession
    {
        return TableSession::where('token', $token)
            ->with(['tenant', 'table.floor'])
            ->firstOrFail();
    }

    /**
     * Format a MenuItem for guest consumption.
     */
    private function formatItem(MenuItem $item): array
    {
        return [
            'id'            => $item->id,
            'name'          => $item->name,
            'description'   => $item->description,
            'image_url'     => $item->image_url,
            'base_price'    => $item->base_price,
            'unit'          => $item->unit,
            'prep_time_min' => $item->prep_time_min,
            'tags'          => $item->tags ?? [],
            'is_available'  => $item->is_available,
            'variants'      => $item->relationLoaded('variants')
                ? $item->variants->where('is_available', true)->values()
                : [],
            'modifiers'     => $item->relationLoaded('modifiers')
                ? $item->modifiers->where('is_available', true)->values()
                : [],
        ];
    }

    /**
     * Human-readable order status label.
     */
    private function statusLabel(string $status): string
    {
        return match ($status) {
            Order::STATUS_PENDING   => 'Order received',
            Order::STATUS_CONFIRMED => 'Sent to kitchen',
            Order::STATUS_PREPARING => 'Being prepared',
            Order::STATUS_READY     => 'Ready to serve',
            Order::STATUS_SERVED    => 'Served',
            Order::STATUS_PAID      => 'Paid',
            Order::STATUS_CANCELLED => 'Cancelled',
            default                 => ucfirst($status),
        };
    }
}
