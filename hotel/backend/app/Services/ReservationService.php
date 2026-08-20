<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Table;
use App\Models\TableSession;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * ReservationService
 *
 * Encapsulates all business logic for reservations:
 *  - Availability checks (which tables are free for a given slot)
 *  - Conflict detection (is a specific table already booked?)
 *  - Auto-assignment (pick the best-fit table for a party size)
 *  - Session handoff (open a TableSession when a guest arrives)
 */
class ReservationService
{
    /**
     * Return tables that are free for a given date/time slot.
     *
     * A table is considered available if:
     *  1. It is active
     *  2. Its capacity >= requested covers
     *  3. It has no conflicting confirmed/tentative reservation in the window
     *  4. It does not have an open TableSession at the start of the slot
     *     (i.e. not currently occupied by walk-in guests)
     *
     * @param  string   $tenantId
     * @param  Carbon   $start       Requested arrival time
     * @param  int      $durationMin Length of stay in minutes (default 90)
     * @param  int      $covers      Party size
     * @param  string|null $excludeReservationId  Exclude this reservation from conflict check (for edits)
     * @return Collection<Table>
     */
    public function availableTables(
        string  $tenantId,
        Carbon  $start,
        int     $durationMin = 90,
        int     $covers = 1,
        ?string $excludeReservationId = null
    ): Collection {
        $end = $start->copy()->addMinutes($durationMin);

        // All active tables with sufficient capacity
        $tables = Table::forTenant($tenantId)
            ->active()
            ->where('capacity', '>=', $covers)
            ->with('activeSession')
            ->orderBy('capacity') // smallest-fit first
            ->get();

        return $tables->filter(function (Table $table) use (
            $tenantId, $start, $end, $excludeReservationId
        ) {
            // Skip if currently occupied by an open walk-in session
            if ($table->activeSession !== null) {
                return false;
            }

            // Skip if a conflicting reservation exists
            return ! $this->hasConflict($tenantId, $table->id, $start, $end, $excludeReservationId);
        })->values();
    }

    /**
     * Check whether a specific table has a booking conflict in a time window.
     *
     * @param  string      $tenantId
     * @param  string      $tableId
     * @param  Carbon      $start
     * @param  Carbon      $end
     * @param  string|null $excludeReservationId
     * @return bool
     */
    public function hasConflict(
        string  $tenantId,
        string  $tableId,
        Carbon  $start,
        Carbon  $end,
        ?string $excludeReservationId = null
    ): bool {
        $query = Reservation::forTenant($tenantId)
            ->conflicting($tableId, $start, $end);

        if ($excludeReservationId) {
            $query->where('id', '!=', $excludeReservationId);
        }

        return $query->exists();
    }

    /**
     * Auto-assign the best available table for a reservation.
     *
     * Picks the smallest table that fits the party (fewest wasted seats).
     * Returns null if nothing is available.
     */
    public function autoAssignTable(
        string  $tenantId,
        Carbon  $start,
        int     $durationMin,
        int     $covers,
        ?string $excludeReservationId = null
    ): ?Table {
        return $this->availableTables($tenantId, $start, $durationMin, $covers, $excludeReservationId)
            ->first(); // already sorted smallest-fit first
    }

    /**
     * Open a TableSession for an arriving reservation guest.
     *
     * - Marks the table as occupied
     * - Creates and returns a new open TableSession
     * - Should be called inside markArrived()
     *
     * @param  \App\Models\Reservation $reservation  Must have a table_id set
     * @param  string|null $waiterId  Staff opening the session (optional)
     * @return TableSession
     */
    public function openSessionForReservation(
        \App\Models\Reservation $reservation,
        ?string $waiterId = null
    ): TableSession {
        // Mark table occupied
        if ($reservation->table_id) {
            Table::where('id', $reservation->table_id)
                ->update(['status' => Table::STATUS_OCCUPIED]);
        }

        $session = TableSession::create([
            'tenant_id'  => $reservation->tenant_id,
            'table_id'   => $reservation->table_id,
            'waiter_id'  => $waiterId,
            'covers'     => $reservation->covers,
            'guest_name' => $reservation->guest_name,
            'token'      => Str::uuid()->toString(),
            'opened_at'  => now(),
        ]);

        return $session;
    }
}
