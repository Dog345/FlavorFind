<?php

namespace App\Events;

use App\Models\Table;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a table's status changes (free → occupied → cleaning, etc.)
 *
 * The floor plan UI subscribes to this to update table colours in real time
 * without polling.
 *
 * Channel:
 *   private-{slug}.tables  — all staff see the live floor plan
 */
class TableStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Table $table)
    {
    }

    public function broadcastOn(): array
    {
        $slug = $this->table->tenant->slug;

        return [
            new PrivateChannel("{$slug}.tables"),
            new PrivateChannel("{$slug}.dashboard"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'TableStatusChanged';
    }

    public function broadcastWith(): array
    {
        return [
            'table_id'   => $this->table->id,
            'label'      => $this->table->label ?? $this->table->name,
            'status'     => $this->table->status,
            'floor_id'   => $this->table->floor_id,
            'capacity'   => $this->table->capacity,
            'x_pos'      => $this->table->x_pos,
            'y_pos'      => $this->table->y_pos,
            'updated_at' => $this->table->updated_at?->toIso8601String(),
        ];
    }
}
