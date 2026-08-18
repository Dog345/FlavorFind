<?php

namespace App\Http\Controllers;

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

    /**
     * POST /api/orders/{order}/payments/mpesa
     *
     * Initiate an M-Pesa STK Push for the given order.
     */
    public function initiateStk(Request $request, int $orderId): JsonResponse
    {
        $tenant = $request->tenant();

        $order = Order::where('tenant_id', $tenant->id)
            ->where('id', $orderId)
            ->firstOrFail();

        if ($order->isPaid()) {
            return response()->json(['message' => 'Order is already paid.'], 409);
        }

        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^254[0-9]{9}$/'],
        ]);

        // Create a pending payment record before hitting Safaricom
        $payment = Payment::create([
            'tenant_id' => $tenant->id,
            'order_id'  => $order->id,
            'method'    => Payment::METHOD_MPESA,
            'status'    => Payment::STATUS_PENDING,
            'amount'    => $order->total_amount,
            'phone'     => $data['phone'],
        ]);

        try {
            $response = $this->daraja->stkPush(
                $data['phone'],
                (int) round($order->total_amount),
                (string) $order->id
            );

            $payment->update([
                'checkout_request_id'  => $response['CheckoutRequestID'] ?? null,
                'merchant_request_id'  => $response['MerchantRequestID'] ?? null,
                'metadata'             => $response,
            ]);

            return response()->json([
                'message'              => 'STK Push sent. Waiting for customer to confirm.',
                'payment_id'           => $payment->id,
                'checkout_request_id'  => $response['CheckoutRequestID'] ?? null,
            ], 202);
        } catch (\Exception $e) {
            $payment->update(['status' => Payment::STATUS_FAILED]);

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

    /**
     * POST /api/payments/mpesa/callback
     *
     * Safaricom callback — NO auth middleware on this route.
     * Verifies the payload and marks the corresponding payment as completed/failed.
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
            ->first();

        if (! $payment) {
            Log::warning('M-Pesa callback: payment record not found', [
                'checkout_request_id' => $parsed['checkout_request_id'],
            ]);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted'], 200);
        }

        DB::transaction(function () use ($payment, $parsed) {
            if ($parsed['success']) {
                $payment->markCompleted($parsed['mpesa_receipt']);

                // Mark the order as paid
                $payment->order()->update(['status' => Order::STATUS_PAID]);
            } else {
                $payment->update([
                    'status'   => Payment::STATUS_FAILED,
                    'metadata' => array_merge($payment->metadata ?? [], ['result' => $parsed]),
                ]);
            }
        });

        // Safaricom expects this exact response
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted'], 200);
    }

    /**
     * POST /api/orders/{order}/payments/cash
     *
     * Record a cash payment. Cashier/manager only.
     */
    public function cash(Request $request, int $orderId): JsonResponse
    {
        $tenant = $request->tenant();

        $order = Order::where('tenant_id', $tenant->id)
            ->where('id', $orderId)
            ->firstOrFail();

        if ($order->isPaid()) {
            return response()->json(['message' => 'Order is already paid.'], 409);
        }

        $data = $request->validate([
            'amount_tendered' => ['required', 'numeric', 'min:0'],
        ]);

        $tendered  = (float) $data['amount_tendered'];
        $total     = (float) $order->total_amount;
        $changeDue = max(0, $tendered - $total);

        if ($tendered < $total) {
            return response()->json([
                'message'     => 'Amount tendered is less than order total.',
                'total'       => $total,
                'tendered'    => $tendered,
                'shortfall'   => $total - $tendered,
            ], 422);
        }

        DB::transaction(function () use ($tenant, $order, $tendered, $total, $changeDue) {
            Payment::create([
                'tenant_id'       => $tenant->id,
                'order_id'        => $order->id,
                'method'          => Payment::METHOD_CASH,
                'status'          => Payment::STATUS_COMPLETED,
                'amount'          => $total,
                'amount_tendered' => $tendered,
                'change_due'      => $changeDue,
                'paid_at'         => now(),
            ]);

            $order->update(['status' => Order::STATUS_PAID]);
        });

        return response()->json([
            'message'    => 'Payment recorded.',
            'total'      => $total,
            'tendered'   => $tendered,
            'change_due' => $changeDue,
        ]);
    }

    /**
     * GET /api/payments/{payment}/status
     *
     * Poll payment status (frontend can call this after STK push).
     * Optionally refreshes from Safaricom if still pending.
     */
    public function status(Request $request, int $paymentId): JsonResponse
    {
        $tenant = $request->tenant();

        $payment = Payment::where('tenant_id', $tenant->id)
            ->where('id', $paymentId)
            ->firstOrFail();

        // If still pending after a reasonable time, query Safaricom for the real status
        if (
            $payment->status === Payment::STATUS_PENDING
            && $payment->checkout_request_id
            && $payment->created_at->diffInSeconds(now()) > 15
        ) {
            try {
                $result = $this->daraja->queryStatus($payment->checkout_request_id);

                $resultCode = $result['ResultCode'] ?? null;

                if ($resultCode === '0' || $resultCode === 0) {
                    $payment->markCompleted();
                    $payment->order()->update(['status' => Order::STATUS_PAID]);
                } elseif ($resultCode !== null) {
                    $payment->update(['status' => Payment::STATUS_FAILED]);
                }
            } catch (\Exception $e) {
                Log::warning('Could not query M-Pesa status', ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'payment' => [
                'id'                   => $payment->id,
                'order_id'             => $payment->order_id,
                'method'               => $payment->method,
                'status'               => $payment->status,
                'amount'               => $payment->amount,
                'mpesa_receipt'        => $payment->mpesa_receipt,
                'checkout_request_id'  => $payment->checkout_request_id,
                'paid_at'              => $payment->paid_at?->toIso8601String(),
            ],
        ]);
    }
}
