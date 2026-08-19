<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TableSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * GET /api/v1/orders
     * List orders for the tenant. Supports filtering by status, table, session, date.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $query = Order::forTenant($tenant->id)
            ->with(['table:id,label', 'waiter:id,name', 'items'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->integer('table_id'));
        }

        if ($request->filled('session_id')) {
            $query->where('session_id', $request->integer('session_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->string('date'));
        }

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $orders = $query->paginate(30);

        return response()->json($orders);
    }

    /**
     * POST /api/v1/orders
     * Create a new order for a table session.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'session_id'   => 'required|integer',
            'type'         => 'sometimes|in:dine_in,takeaway,delivery',
            'notes'        => 'sometimes|nullable|string|max:500',
            'items'        => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|integer',
            'items.*.variant_id'   => 'sometimes|nullable|integer',
            'items.*.quantity'     => 'required|integer|min:1|max:50',
            'items.*.notes'        => 'sometimes|nullable|string|max:200',
            'items.*.modifiers'    => 'sometimes|array',
            'items.*.modifiers.*.name'        => 'required|string|max:100',
            'items.*.modifiers.*.price_delta' => 'required|numeric',
        ]);

        // Verify session belongs to this tenant and is open
        $session = TableSession::where('tenant_id', $tenant->id)
            ->where('id', $data['session_id'])
            ->whereNull('closed_at')
            ->first();

        if (! $session) {
            return response()->json(['error' => 'Session not found or already closed.'], 404);
        }

        // Resolve menu items and build line items
        $menuItemIds = collect($data['items'])->pluck('menu_item_id')->unique();
        $menuItems   = MenuItem::forTenant($tenant->id)
            ->whereIn('id', $menuItemIds)
            ->with('variants')
            ->get()
            ->keyBy('id');

        // Validate all menu items exist
        foreach ($data['items'] as $line) {
            if (! $menuItems->has($line['menu_item_id'])) {
                return response()->json([
                    'error' => "Menu item #{$line['menu_item_id']} not found.",
                ], 404);
            }
        }

        $order = DB::transaction(function () use ($tenant, $session, $data, $menuItems, $request) {
            // Generate order number
            $orderNumber = $this->nextOrderNumber($tenant->id);

            $order = Order::create([
                'tenant_id'    => $tenant->id,
                'session_id'   => $session->id,
                'table_id'     => $session->table_id,
                'waiter_id'    => $request->user()->id,
                'order_number' => $orderNumber,
                'status'       => Order::STATUS_PENDING,
                'type'         => $data['type'] ?? Order::TYPE_DINE_IN,
                'notes'        => $data['notes'] ?? null,
                'subtotal'     => 0,
                'tax_amount'   => 0,
                'discount_amount' => 0,
                'total_amount' => 0,
            ]);

            foreach ($data['items'] as $line) {
                $menuItem  = $menuItems[$line['menu_item_id']];
                $unitPrice = $menuItem->base_price;

                // Use variant price if specified
                if (! empty($line['variant_id'])) {
                    $variant = $menuItem->variants->firstWhere('id', $line['variant_id']);
                    if ($variant) {
                        $unitPrice = $variant->price;
                    }
                }

                $modifiers   = $line['modifiers'] ?? [];
                $modifierSum = collect($modifiers)->sum('price_delta');
                $lineTotal   = round(($unitPrice + $modifierSum) * $line['quantity'], 2);

                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'variant_id'   => $line['variant_id'] ?? null,
                    'name'         => $menuItem->name,
                    'unit_price'   => $unitPrice,
                    'quantity'     => $line['quantity'],
                    'line_total'   => $lineTotal,
                    'modifiers'    => $modifiers ?: null,
                    'notes'        => $line['notes'] ?? null,
                    'status'       => OrderItem::STATUS_PENDING,
                ]);
            }

            // Recalculate totals from saved items
            $order->load('items');
            $order->recalculate();

            return $order;
        });

        return response()->json([
            'data' => $order->load(['items', 'table:id,label', 'waiter:id,name']),
        ], 201);
    }

    /**
     * GET /api/v1/orders/{id}
     * Show a single order with all items and payment.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $order = $this->findForTenant($request, $id);

        return response()->json([
            'data' => $order->load([
                'items.menuItem:id,name',
                'table:id,label',
                'waiter:id,name',
                'session:id,covers,guest_name',
                'payment',
            ]),
        ]);
    }

    /**
     * PATCH /api/v1/orders/{id}/status
     * Update order status. Enforces valid transitions.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $order = $this->findForTenant($request, $id);

        $data = $request->validate([
            'status' => ['required', 'in:' . implode(',', Order::STATUSES)],
        ]);

        $newStatus = $data['status'];

        if ($order->isPaid()) {
            return response()->json(['error' => 'Cannot change status of a paid order.'], 422);
        }

        if ($order->isCancelled()) {
            return response()->json(['error' => 'Cannot change status of a cancelled order.'], 422);
        }

        $timestamps = [];

        if ($newStatus === Order::STATUS_CONFIRMED) {
            $timestamps['kitchen_accepted_at'] = now();
        } elseif ($newStatus === Order::STATUS_READY) {
            $timestamps['kitchen_ready_at'] = now();
        } elseif ($newStatus === Order::STATUS_SERVED) {
            $timestamps['served_at'] = now();
        }

        $order->update(array_merge(['status' => $newStatus], $timestamps));

        return response()->json(['data' => $order->fresh()]);
    }

    /**
     * POST /api/v1/orders/{id}/cancel
     * Cancel an order (only if not yet paid or served).
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = $this->findForTenant($request, $id);

        if ($order->isPaid()) {
            return response()->json(['error' => 'Cannot cancel a paid order.'], 422);
        }

        if ($order->isCancelled()) {
            return response()->json(['error' => 'Order is already cancelled.'], 422);
        }

        if ($order->status === Order::STATUS_SERVED) {
            return response()->json(['error' => 'Cannot cancel an order that has been served.'], 422);
        }

        $order->update(['status' => Order::STATUS_CANCELLED]);

        return response()->json([
            'message' => 'Order cancelled.',
            'data'    => $order->fresh(),
        ]);
    }

    /**
     * GET /api/v1/orders/kitchen
     * Kitchen display queue — confirmed + preparing orders, ordered by age.
     */
    public function kitchen(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $orders = Order::forTenant($tenant->id)
            ->kitchenQueue()
            ->with([
                'items' => fn ($q) => $q->where('status', '!=', OrderItem::STATUS_CANCELLED),
                'table:id,label',
            ])
            ->oldest() // Oldest first — FIFO
            ->get();

        return response()->json(['data' => $orders]);
    }

    /**
     * GET /api/v1/orders/session/{sessionId}
     * All orders for a specific table session (used on POS to show running bill).
     */
    public function bySession(Request $request, int $sessionId): JsonResponse
    {
        $tenant = $request->tenant();

        $session = TableSession::where('tenant_id', $tenant->id)
            ->where('id', $sessionId)
            ->first();

        if (! $session) {
            return response()->json(['error' => 'Session not found.'], 404);
        }

        $orders = Order::forTenant($tenant->id)
            ->where('session_id', $sessionId)
            ->with(['items', 'payment'])
            ->latest()
            ->get();

        $sessionTotal = $orders
            ->whereNotIn('status', [Order::STATUS_CANCELLED])
            ->sum('total_amount');

        return response()->json([
            'data'          => $orders,
            'session_total' => round($sessionTotal, 2),
        ]);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function findForTenant(Request $request, int $id): Order
    {
        $tenant = $request->tenant();
        $order  = Order::forTenant($tenant->id)->find($id);

        if (! $order) {
            abort(404, 'Order not found.');
        }

        return $order;
    }

    private function nextOrderNumber(int $tenantId): string
    {
        // Tenant-scoped sequential number padded to 4 digits
        $count = Order::where('tenant_id', $tenantId)->count() + 1;
        return '#' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
