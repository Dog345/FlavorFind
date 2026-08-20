<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a reservation status changes (confirmed, arrived, cancelled, no-show).
 * The manager dashboard subscribes to {slug}.dashboard.
 */
class ReservationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Reservation $reservation)
    {
    }

    public function broadcastOn(): array
    {
        $slug = $this->reservation->tenant->slug;

        return [
            new PrivateChannel("{$slug}.dashboard"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reservation.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'reservation_id' => $this->reservation->id,
            'guest_name'     => $this->reservation->guest_name,
            'guest_phone'    => $this->reservation->guest_phone,
            'covers'         => $this->reservation->covers,
            'reserved_at'    => $this->reservation->reserved_at?->toIso8601String(),
            'status'         => $this->reservation->status,
            'table_id'       => $this->reservation->table_id,
            'table_label'    => $this->reservation->table?->label,
            'updated_at'     => $this->reservation->updated_at?->toIso8601String(),
        ];
    }
}
