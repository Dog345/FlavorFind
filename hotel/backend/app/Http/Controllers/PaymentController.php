<?php

namespace App\Http\Controllers;

use App\Events\PaymentReceived;
use App\Models\Order;
use App\Models\Payment;
use App\Services\DarajaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function __construct(private readonly DarajaService $daraja)
    {
    }

    // ──────────────────────────────────────────────────────────────────────────
    // M-Pesa STK Push
    // POST /api/v1/orders/{orderId}/payments/mpesa
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Initiate an M-Pesa STK Push payment for an order.
     * Supports partial payments — pass the amount you want to charge.
     * If amount is omitted, the outstanding balance is used.
     */
    public function initiateStk(Request $request, string $orderId): JsonResponse
    {
        $tenant = $request->tenant();
        $order  = $this->findOrder($tenant->id, $orderId);

        if ($order->status === Order::STATUS_PAID) {
            return response()->json(['message' => 'Order is already fully paid.'], 409);
        }

        $outstanding = $this->outstandingBalance($order);

        $data = $request->validate([
            'phone'  => ['required', 'string', 'regex:/^254[0-9]{9}$/'],
            'amount' => ['sometimes', 'numeric', 'min:1', "max:{$outstanding}"],
        ]);

        $amount  = isset($data['amount']) ? (float) $data['amount'] : $outstanding;

        // Create a pending payment row before hitting Safaricom so we have a
        // record even if the app crashes before receiving the callback.
        $payment = Payment::create([
            'tenant_id'  => $tenant->id,
            'order_id'   => $order->id,
            'method'     => Payment::METHOD_MPESA,
            'status'     => Payment::STATUS_PENDING,
            'amount'     => $amount,
            'phone'      => $data['phone'],
            'cashier_id' => $request->user()?->id,
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
                'message'             => 'STK Push sent. Waiting for customer to confirm.',
                'payment_id'          => $payment->id,
                'checkout_request_id' => $response['CheckoutRequestID'] ?? null,
                'amount'              => (float) $amount,
                'outstanding_after'   => (float) round($outstanding - $amount, 2),
            ], 202, [], JSON_PRESERVE_ZERO_FRACTION);

        } catch (\Exception $e) {
            // Use a direct DB update to ensure the status change persists
            // even if the Eloquent model's dirty-state tracking is confused
            // by the partial state at throw time.
            \Illuminate\Support\Facades\DB::table('payments')
                ->where('id', $payment->id)
                ->update(['status' => Payment::STATUS_FAILED]);

            Log::error('STK Push failed', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to initiate M-Pesa payment.',
                'error'   => $e->getMessage(),
            ], 502);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // M-Pesa Callback — NO auth, Safaricom calls this directly
    // POST /api/v1/payments/mpesa/callback
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Handle Safaricom STK Push callback.
     * Always returns 200 with the expected ResultCode/ResultDesc body so
     * Safaricom does not retry indefinitely.
     */
    public function mpesaCallback(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('M-Pesa callback received', ['payload' => $payload]);

        try {
            $parsed = $this->daraja->parseCallback($payload);
        } catch (\Throwable $e) {
            Log::error('Failed to parse M-Pesa callback', ['error' => $e->getMessage()]);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted'], 200);
        }

        $payment = Payment::where('checkout_request_id', $parsed['checkout_request_id'])
            ->whereNotNull('tenant_id') // must belong to a real tenant
            ->first();

        if (! $payment) {
            Log::warning('M-Pesa callback: no matching payment', [
                'checkout_request_id' => $parsed['checkout_request_id'],
            ]);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted'], 200);
        }

        DB::transaction(function () use ($payment, $parsed) {
            if ($parsed['success']) {
                $payment->markCompleted($parsed['mpesa_receipt']);
                $this->markOrderPaidIfFullyCovered($payment);
            } else {
                $payment->update([
                    'status'   => Payment::STATUS_FAILED,
                    'metadata' => array_merge($payment->metadata ?? [], ['result' => $parsed]),
                ]);
            }
        });

        if ($payment->isCompleted()) {
            $payment->load('order');
            event(new PaymentReceived($payment));
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted'], 200);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Cash Payment
    // POST /api/v1/orders/{orderId}/payments/cash
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Record a cash payment. Supports partial payments for split bill.
     * If amount_tendered >= order total, the order is marked paid.
     */
    public function cash(Request $request, string $orderId): JsonResponse
    {
        $tenant = $request->tenant();
        $order  = $this->findOrder($tenant->id, $orderId);

        if ($order->status === Order::STATUS_PAID) {
            return response()->json(['message' => 'Order is already fully paid.'], 409);
        }

        $outstanding = $this->outstandingBalance($order);

        $data = $request->validate([
            'amount_tendered' => ['required', 'numeric', 'min:0.01'],
            'notes'           => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $tendered  = (float) $data['amount_tendered'];
        $applied   = min($tendered, $outstanding);  // never over-pay beyond balance
        $changeDue = max(0, $tendered - $outstanding);

        $payment = null;

        DB::transaction(function () use ($tenant, $order, $tendered, $applied, $changeDue, $data, $request, &$payment) {
            $payment = Payment::create([
                'tenant_id'       => $tenant->id,
                'order_id'        => $order->id,
                'method'          => Payment::METHOD_CASH,
                'status'          => Payment::STATUS_COMPLETED,
                'amount'          => $applied,
                'amount_tendered' => $tendered,
                'change_due'      => $changeDue,
                'cashier_id'      => $request->user()?->id,
                'notes'           => $data['notes'] ?? null,
                'paid_at'         => now(),
            ]);

            $this->markOrderPaidIfFullyCovered($payment);
        });

        $payment->load('order');
        event(new PaymentReceived($payment));

        return response()->json([
            'message'           => 'Cash payment recorded.',
            'payment_id'        => $payment->id,
            'amount_applied'    => (float) $applied,
            'amount_tendered'   => (float) $tendered,
            'change_due'        => (float) $changeDue,
            'order_status'      => $payment->order->status,
            'outstanding_after' => (float) max(0, round($outstanding - $applied, 2)),
        ], 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External Payment
    // POST /api/v1/orders/{orderId}/payments/external
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Record an external payment — card terminal, bank transfer, Airtel Money,
     * or any other payment handled outside this system.
     *
     * No STK push or callbacks involved. The cashier just enters the reference
     * from their external system and confirms the amount received.
     */
    public function external(Request $request, string $orderId): JsonResponse
    {
        $tenant = $request->tenant();
        $order  = $this->findOrder($tenant->id, $orderId);

        if ($order->status === Order::STATUS_PAID) {
            return response()->json(['message' => 'Order is already fully paid.'], 409);
        }

        $outstanding = $this->outstandingBalance($order);

        $data = $request->validate([
            'amount'            => ['required', 'numeric', 'min:0.01', "max:{$outstanding}"],
            'external_reference'=> ['required', 'string', 'max:100'],
            'external_provider' => ['sometimes', 'nullable', 'string', 'max:100'],
            'notes'             => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $payment = null;

        DB::transaction(function () use ($tenant, $order, $data, $request, &$payment) {
            $payment = Payment::create([
                'tenant_id'          => $tenant->id,
                'order_id'           => $order->id,
                'method'             => Payment::METHOD_EXTERNAL,
                'status'             => Payment::STATUS_COMPLETED,
                'amount'             => (float) $data['amount'],
                'external_reference' => $data['external_reference'],
                'external_provider'  => $data['external_provider'] ?? null,
                'cashier_id'         => $request->user()?->id,
                'notes'              => $data['notes'] ?? null,
                'paid_at'            => now(),
            ]);

            $this->markOrderPaidIfFullyCovered($payment);
        });

        $payment->load('order');
        event(new PaymentReceived($payment));

        return response()->json([
            'message'           => 'External payment recorded.',
            'payment_id'        => $payment->id,
            'amount'            => (float) $payment->amount,
            'external_reference'=> $payment->external_reference,
            'external_provider' => $payment->external_provider,
            'order_status'      => $payment->order->status,
            'outstanding_after' => (float) $this->outstandingBalance($payment->order->fresh()),
        ], 201, [], JSON_PRESERVE_ZERO_FRACTION);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Payment Status Polling
    // GET /api/v1/payments/{paymentId}/status
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Poll a single payment's status.
     * For M-Pesa pending payments older than 15s, queries Daraja directly.
     */
    public function status(Request $request, string $paymentId): JsonResponse
    {
        $tenant  = $request->tenant();
        $payment = Payment::where('tenant_id', $tenant->id)
            ->where('id', $paymentId)
            ->firstOrFail();

        // Refresh from Safaricom if still pending and old enough
        if (
            $payment->status === Payment::STATUS_PENDING
            && $payment->checkout_request_id
            && $payment->created_at->diffInSeconds(now()) > 15
        ) {
            try {
                $result     = $this->daraja->queryStatus($payment->checkout_request_id);
                $resultCode = $result['ResultCode'] ?? null;

                if ($resultCode === '0' || $resultCode === 0) {
                    $payment->markCompleted();
                    $payment->load('order');
                    $this->markOrderPaidIfFullyCovered($payment);
                    event(new PaymentReceived($payment));
                } elseif ($resultCode !== null) {
                    $payment->update(['status' => Payment::STATUS_FAILED]);
                }
            } catch (\Exception $e) {
                Log::warning('Could not query M-Pesa status', ['error' => $e->getMessage()]);
            }

            $payment->refresh();
        }

        return response()->json([
            'payment' => $this->formatPayment($payment),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Payment Listing
    // GET /api/v1/payments
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * List payments for the tenant with optional filters.
     *
     * Query params:
     *   order_id    — filter by order UUID
     *   method      — mpesa|cash|card|external|complimentary
     *   status      — pending|completed|failed|cancelled|refunded
     *   date_from   — YYYY-MM-DD
     *   date_to     — YYYY-MM-DD
     *   per_page    — default 20
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $request->validate([
            'order_id'  => ['sometimes', 'uuid'],
            'method'    => ['sometimes', Rule::in(Payment::METHODS)],
            'status'    => ['sometimes', Rule::in(Payment::STATUSES)],
            'date_from' => ['sometimes', 'date'],
            'date_to'   => ['sometimes', 'date', 'after_or_equal:date_from'],
            'per_page'  => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Payment::where('tenant_id', $tenant->id)
            ->with(['order:id,order_number,total_amount,status', 'cashier:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        if ($request->filled('method')) {
            $query->where('method', $request->method);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage  = (int) $request->get('per_page', 20);
        $payments = $query->paginate($perPage);

        return response()->json([
            'data'  => $payments->map(fn ($p) => $this->formatPayment($p)),
            'meta'  => [
                'total'        => $payments->total(),
                'per_page'     => $payments->perPage(),
                'current_page' => $payments->currentPage(),
                'last_page'    => $payments->lastPage(),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Daily Reconciliation Summary
    // GET /api/v1/payments/reconciliation
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Total collected today (or a given date) grouped by payment method.
     * Useful for end-of-day cash-up.
     */
    public function reconciliation(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $request->validate([
            'date' => ['sometimes', 'date'],
        ]);

        $date = $request->get('date', today()->toDateString());

        $totals = Payment::where('tenant_id', $tenant->id)
            ->where('status', Payment::STATUS_COMPLETED)
            ->whereDate('paid_at', $date)
            ->selectRaw('method, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('method')
            ->get();

        $grandTotal = $totals->sum('total');

        return response()->json([
            'date'        => $date,
            'grand_total' => (float) round($grandTotal, 2),
            'by_method'   => $totals->map(fn ($row) => [
                'method' => $row->method,
                'count'  => $row->count,
                'total'  => (float) round($row->total, 2),
            ])->values(),
        ], 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Find an order scoped to the tenant or throw 404.
     */
    private function findOrder(string $tenantId, string $orderId): Order
    {
        return Order::where('tenant_id', $tenantId)
            ->where('id', $orderId)
            ->firstOrFail();
    }

    /**
     * Calculate how much is still owed on an order after existing completed payments.
     */
    private function outstandingBalance(Order $order): float
    {
        $paid = Payment::where('order_id', $order->id)
            ->where('status', Payment::STATUS_COMPLETED)
            ->sum('amount');

        return max(0, round((float) $order->total_amount - $paid, 2));
    }

    /**
     * If the sum of completed payments covers the order total, mark order paid.
     * Uses a pessimistic lock to prevent race conditions on concurrent payments.
     */
    private function markOrderPaidIfFullyCovered(Payment $payment): void
    {
        // Lock the order row so concurrent payments don't both mark it paid
        $order = Order::where('id', $payment->order_id)
            ->lockForUpdate()
            ->first();

        if (! $order || $order->isPaid()) {
            return;
        }

        $totalPaid = Payment::where('order_id', $order->id)
            ->where('status', Payment::STATUS_COMPLETED)
            ->sum('amount');

        if ($totalPaid >= $order->total_amount) {
            $order->update(['status' => Order::STATUS_PAID]);
        }
    }

    /**
     * Consistent serialisation for a Payment model.
     */
    private function formatPayment(Payment $payment): array
    {
        return [
            'id'                  => $payment->id,
            'order_id'            => $payment->order_id,
            'order_number'        => $payment->order?->order_number,
            'method'              => $payment->method,
            'status'              => $payment->status,
            'amount'              => $payment->amount,
            'amount_tendered'     => $payment->amount_tendered,
            'change_due'          => $payment->change_due,
            'mpesa_receipt'       => $payment->mpesa_receipt,
            'checkout_request_id' => $payment->checkout_request_id,
            'external_reference'  => $payment->external_reference,
            'external_provider'   => $payment->external_provider,
            'cashier'             => $payment->cashier
                ? ['id' => $payment->cashier->id, 'name' => $payment->cashier->name]
                : null,
            'notes'               => $payment->notes,
            'paid_at'             => $payment->paid_at?->toIso8601String(),
            'created_at'          => $payment->created_at->toIso8601String(),
        ];
    }
}
