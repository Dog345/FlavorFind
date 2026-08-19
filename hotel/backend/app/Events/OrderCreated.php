<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a new order is confirmed and sent to the kitchen.
 *
 * Channels:
 *   private-{slug}.kitchen    — kitchen display board
 *   private-{slug}.dashboard  — manager live stats tile
 */
class OrderCreated implements ShouldBroadcast
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
        return 'OrderCreated';
    }

    public function broadcastWith(): array
    {
        $items = $this->order->items->map(fn ($item) => [
            'id'        => $item->id,
            'name'      => $item->name,
            'quantity'  => $item->quantity,
            'status'    => $item->status,
            'notes'     => $item->notes,
            'modifiers' => $item->modifiers ?? [],
        ]);

        return [
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
            'status'       => $this->order->status,
            'type'         => $this->order->type ?? $this->order->order_type,
            'table_id'     => $this->order->table_id,
            'table_label'  => $this->order->table?->label ?? $this->order->table?->name,
            'waiter'       => $this->order->waiter?->name,
            'items'        => $items,
            'total_amount' => $this->order->total_amount,
            'notes'        => $this->order->notes,
            'created_at'   => $this->order->created_at?->toIso8601String(),
        ];
    }
}
