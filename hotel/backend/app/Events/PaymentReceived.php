<?php

namespace App\Events;

use App\Models\Payment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired whenever a payment is marked completed (M-Pesa, cash, or external).
 *
 * Broadcasts on a private per-tenant channel so the dashboard can update
 * the order status and payment status in real time without polling.
 *
 * Channel: private-tenant.{tenantId}.payments
 */
class PaymentReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Payment $payment)
    {
    }

    /**
     * Broadcast on the private tenant channel using slug (consistent with all other events).
     * Channel auth is handled in routes/channels.php.
     */
    public function broadcastOn(): array
    {
        $slug = $this->payment->tenant->slug;

        return [
            new PrivateChannel("{$slug}.payments"),
            new PrivateChannel("{$slug}.dashboard"),
        ];
    }

    /**
     * Broadcast as 'PaymentReceived' event name.
     */
    public function broadcastAs(): string
    {
        return 'PaymentReceived';
    }

    /**
     * Data sent to the frontend over the WebSocket.
     */
    public function broadcastWith(): array
    {
        $payment = $this->payment;
        $order   = $payment->order;

        return [
            'payment' => [
                'id'                  => $payment->id,
                'order_id'            => $payment->order_id,
                'method'              => $payment->method,
                'status'              => $payment->status,
                'amount'              => $payment->amount,
                'mpesa_receipt'       => $payment->mpesa_receipt,
                'external_reference'  => $payment->external_reference,
                'external_provider'   => $payment->external_provider,
                'paid_at'             => $payment->paid_at?->toIso8601String(),
            ],
            'order' => $order ? [
                'id'           => $order->id,
                'order_number' => $order->order_number,
                'status'       => $order->status,
                'total_amount' => $order->total_amount,
            ] : null,
        ];
    }
}
