<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a new order is created.
 * Kitchen display subscribes to {slug}.kitchen to hear this.
 */
class OrderPlaced implements ShouldBroadcast
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
            new PrivateChannel("{$slug}.dashboard"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.placed';
    }

    public function broadcastWith(): array
    {
        $items = $this->order->items->map(fn ($item) => [
            'name'       => $item->name,
            'quantity'   => $item->quantity,
            'notes'      => $item->notes,
            'modifiers'  => $item->modifiers,
        ]);

        return [
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
            'status'       => $this->order->status,
            'type'         => $this->order->type,
            'table_id'     => $this->order->table_id,
            'table_label'  => $this->order->table?->label,
            'waiter'       => $this->order->waiter?->name,
            'items'        => $items,
            'total_amount' => $this->order->total_amount,
            'notes'        => $this->order->notes,
            'created_at'   => $this->order->created_at?->toIso8601String(),
        ];
    }
}
