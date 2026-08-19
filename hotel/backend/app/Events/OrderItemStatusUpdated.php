<?php

namespace App\Events;

use App\Models\OrderItem;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a kitchen staff member updates an individual order item's status.
 *
 * e.g. kitchen taps "Start cooking" → status: pending → preparing
 *      kitchen taps "Ready"         → status: preparing → ready
 *
 * Channels:
 *   private-{slug}.kitchen           — all kitchen staff see item-level updates
 *   private-{slug}.orders.{orderId}  — waiter tracking this specific order
 */
class OrderItemStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly OrderItem $item)
    {
    }

    public function broadcastOn(): array
    {
        $slug    = $this->item->order->tenant->slug;
        $orderId = $this->item->order_id;

        return [
            new PrivateChannel("{$slug}.kitchen"),
            new PrivateChannel("{$slug}.orders.{$orderId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'OrderItemStatusUpdated';
    }

    public function broadcastWith(): array
    {
        $order = $this->item->order;

        return [
            'order_id'     => $order->id,
            'order_number' => $order->order_number,
            'item' => [
                'id'       => $this->item->id,
                'name'     => $this->item->name,
                'quantity' => $this->item->quantity,
                'status'   => $this->item->status,
                'notes'    => $this->item->notes,
            ],
            // Convenience: all items in the order so the KDS can re-render
            'order_items' => $order->items->map(fn ($i) => [
                'id'     => $i->id,
                'name'   => $i->name,
                'status' => $i->status,
            ]),
            'updated_at' => $this->item->updated_at?->toIso8601String(),
        ];
    }
}
