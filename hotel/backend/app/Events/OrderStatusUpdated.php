<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired whenever an order's status changes.
 *
 * Broadcasts on two channels:
 *   - {slug}.kitchen           → kitchen display sees new/updated orders
 *   - {slug}.orders.{orderId}  → waiter tracking a specific order
 */
class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Order $order)
    {
    }

    public function broadcastOn(): array
    {
        $slug = $this->order->tenant->slug;

        return [
            new PrivateChannel("{$slug}.kitchen"),
            new PrivateChannel("{$slug}.orders.{$this->order->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
            'status'       => $this->order->status,
            'table_id'     => $this->order->table_id,
            'table_label'  => $this->order->table?->label,
            'total_amount' => $this->order->total_amount,
            'updated_at'   => $this->order->updated_at?->toIso8601String(),
        ];
    }
}
