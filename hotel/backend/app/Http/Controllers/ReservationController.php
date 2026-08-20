<?php

namespace App\Http\Controllers;

use App\Events\ReservationUpdated;
use App\Jobs\SendReservationConfirmation;
use App\Models\Reservation;
use App\Models\Table;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function __construct(private readonly ReservationService $reservationService)
    {
    }

    // ─── Listing ──────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/reservations
     * List reservations. Filterable by status, date, today, upcoming.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $query = Reservation::forTenant($tenant->id)
            ->with('table:id,label,capacity')
            ->latest('reserved_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date')) {
            $query->whereDate('reserved_at', $request->string('date'));
        }

        if ($request->boolean('today')) {
            $query->today();
        }

        if ($request->boolean('upcoming')) {
            $query->upcoming();
        }

        return response()->json($query->paginate(30));
    }

    // ─── Availability ─────────────────────────────────────────────────────────

    /**
     * GET /api/v1/reservations/availability
     *
     * Returns tables that are free for a given time slot.
     *
     * Query params:
     *   date         Y-m-d         (required)
     *   time         H:i           (required)
     *   covers       int >= 1      (required)
     *   duration_min int >= 15     (optional, default 90)
     *   exclude_id   UUID          (optional, exclude this reservation from conflict check)
     */
    public function availability(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'date'         => 'required|date_format:Y-m-d',
            'time'         => 'required|date_format:H:i',
            'covers'       => 'required|integer|min:1|max:50',
            'duration_min' => 'sometimes|integer|min:15|max:480',
            'exclude_id'   => 'sometimes|string|uuid',
        ]);

        $start       = \Carbon\Carbon::createFromFormat('Y-m-d H:i', "{$data['date']} {$data['time']}");
        $durationMin = $data['duration_min'] ?? 90;
        $excludeId   = $data['exclude_id'] ?? null;

        if ($start->isPast()) {
            return response()->json(['error' => 'Cannot check availability for a past date/time.'], 422);
        }

        $tables = $this->reservationService->availableTables(
            $tenant->id,
            $start,
            $durationMin,
            $data['covers'],
            $excludeId
        );

        return response()->json([
            'data' => $tables->map(fn (Table $t) => [
                'id'       => $t->id,
                'label'    => $t->label,
                'capacity' => $t->capacity,
                'floor_id' => $t->floor_id,
            ]),
            'meta' => [
                'date'         => $data['date'],
                'time'         => $data['time'],
                'covers'       => $data['covers'],
                'duration_min' => $durationMin,
                'available'    => $tables->count(),
            ],
        ]);
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/reservations
     * Create a new reservation. Optionally auto-assigns a table.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'guest_name'   => 'required|string|max:150',
            'guest_phone'  => 'required|string|max:20',
            'guest_email'  => 'sometimes|nullable|email|max:150',
            'covers'       => 'required|integer|min:1|max:50',
            'reserved_at'  => 'required|date|after:now',
            'duration_min' => 'sometimes|integer|min:15|max:480',
            'table_id'     => 'sometimes|nullable|string|uuid',
            'notes'        => 'sometimes|nullable|string|max:500',
            'source'       => 'sometimes|in:walk_in,phone,online,app',
            'auto_assign'  => 'sometimes|boolean',
        ]);

        $durationMin = $data['duration_min'] ?? 90;
        $start       = \Carbon\Carbon::parse($data['reserved_at']);

        // Explicit table provided — validate ownership and check for conflict
        if (! empty($data['table_id'])) {
            $this->assertTableOwnership($tenant->id, $data['table_id']);

            if ($this->reservationService->hasConflict(
                $tenant->id, $data['table_id'], $start, $start->copy()->addMinutes($durationMin)
            )) {
                return response()->json([
                    'error' => 'The selected table is already booked for this time slot.',
                ], 409);
            }
        } elseif ($request->boolean('auto_assign')) {
            // Auto-assign: pick best-fit available table
            $table = $this->reservationService->autoAssignTable(
                $tenant->id, $start, $durationMin, $data['covers']
            );
            $data['table_id'] = $table?->id;
        }

        $reservation = Reservation::create([
            'tenant_id'    => $tenant->id,
            'table_id'     => $data['table_id'] ?? null,
            'guest_name'   => $data['guest_name'],
            'guest_phone'  => $data['guest_phone'],
            'guest_email'  => $data['guest_email'] ?? null,
            'covers'       => $data['covers'],
            'reserved_at'  => $data['reserved_at'],
            'duration_min' => $durationMin,
            'notes'        => $data['notes'] ?? null,
            'source'       => $data['source'] ?? 'phone',
            'status'       => Reservation::STATUS_TENTATIVE,
        ]);

        // Mark table reserved
        if ($reservation->table_id) {
            Table::where('id', $reservation->table_id)
                ->update(['status' => Table::STATUS_RESERVED]);
        }

        return response()->json([
            'data' => $reservation->load('table:id,label,capacity'),
        ], 201);
    }

    /**
     * GET /api/v1/reservations/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        return response()->json([
            'data' => $reservation->load('table:id,label,capacity', 'session:id,opened_at,covers'),
        ]);
    }

    /**
     * PUT /api/v1/reservations/{id}
     * Update reservation details (guest info, time, table assignment).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $tenant      = $request->tenant();
        $reservation = $this->findForTenant($request, $id);

        if (in_array($reservation->status, [Reservation::STATUS_CANCELLED, Reservation::STATUS_COMPLETED])) {
            return response()->json(['error' => 'Cannot update a completed or cancelled reservation.'], 422);
        }

        $data = $request->validate([
            'guest_name'   => 'sometimes|string|max:150',
            'guest_phone'  => 'sometimes|string|max:20',
            'guest_email'  => 'sometimes|nullable|email|max:150',
            'covers'       => 'sometimes|integer|min:1|max:50',
            'reserved_at'  => 'sometimes|date|after:now',
            'duration_min' => 'sometimes|integer|min:15|max:480',
            'table_id'     => 'sometimes|nullable|string|uuid',
            'notes'        => 'sometimes|nullable|string|max:500',
        ]);

        if (isset($data['table_id'])) {
            $this->assertTableOwnership($tenant->id, $data['table_id']);

            $start       = \Carbon\Carbon::parse($data['reserved_at'] ?? $reservation->reserved_at);
            $durationMin = $data['duration_min'] ?? $reservation->duration_min;

            if ($this->reservationService->hasConflict(
                $tenant->id, $data['table_id'], $start, $start->copy()->addMinutes($durationMin), $reservation->id
            )) {
                return response()->json([
                    'error' => 'The selected table is already booked for this time slot.',
                ], 409);
            }
        }

        $reservation->update($data);

        return response()->json([
            'data' => $reservation->load('table:id,label'),
        ]);
    }

    // ─── Status transitions ───────────────────────────────────────────────────

    /**
     * POST /api/v1/reservations/{id}/confirm
     * Confirm a tentative reservation and dispatch the confirmation notification.
     */
    public function confirm(Request $request, string $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        if ($reservation->status !== Reservation::STATUS_TENTATIVE) {
            return response()->json([
                'error' => "Only tentative reservations can be confirmed. Current status: {$reservation->status}.",
            ], 422);
        }

        $reservation->confirm();

        // Queue confirmation email + SMS
        SendReservationConfirmation::dispatch($reservation->load('tenant', 'table'));

        // Broadcast status change to manager dashboard
        ReservationUpdated::dispatch($reservation->load('table:id,label', 'tenant:id,slug'));

        return response()->json([
            'message' => 'Reservation confirmed. Confirmation notification queued.',
            'data'    => $reservation->fresh()->load('table:id,label'),
        ]);
    }

    /**
     * POST /api/v1/reservations/{id}/arrive
     *
     * Mark guest as arrived.
     * - Opens a new TableSession linked to the reservation
     * - Updates table status to occupied
     * - Returns the new session so the POS can start taking orders
     */
    public function markArrived(Request $request, string $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        if (! in_array($reservation->status, [
            Reservation::STATUS_TENTATIVE,
            Reservation::STATUS_CONFIRMED,
        ])) {
            return response()->json([
                'error' => "Cannot mark arrival for a reservation with status: {$reservation->status}.",
            ], 422);
        }

        if (! $reservation->table_id) {
            return response()->json([
                'error' => 'Cannot open a session — no table assigned to this reservation. Please assign a table first.',
            ], 422);
        }

        // Open the session
        $session = $this->reservationService->openSessionForReservation(
            $reservation,
            $request->user()->id
        );

        // Update reservation: status → arrived, link session
        $reservation->markArrived($session->id);

        ReservationUpdated::dispatch($reservation->load('table:id,label', 'tenant:id,slug'));

        return response()->json([
            'message'    => 'Guest marked as arrived. Table session opened.',
            'data'       => $reservation->fresh()->load('table:id,label'),
            'session_id' => $session->id,
            'session'    => [
                'id'         => $session->id,
                'token'      => $session->token,
                'table_id'   => $session->table_id,
                'covers'     => $session->covers,
                'opened_at'  => $session->opened_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * POST /api/v1/reservations/{id}/cancel
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        if (! $reservation->isCancellable()) {
            return response()->json(['error' => 'This reservation cannot be cancelled.'], 422);
        }

        $data = $request->validate([
            'reason' => 'sometimes|nullable|string|max:300',
        ]);

        $reservation->cancel($data['reason'] ?? null);

        // Free the table if it was reserved
        if ($reservation->table_id) {
            Table::where('id', $reservation->table_id)
                ->where('status', Table::STATUS_RESERVED)
                ->update(['status' => Table::STATUS_AVAILABLE]);
        }

        return response()->json([
            'message' => 'Reservation cancelled.',
            'data'    => $reservation->fresh(),
        ]);
    }

    /**
     * PATCH /api/v1/reservations/{id}/no-show
     */
    public function noShow(Request $request, string $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        if (! in_array($reservation->status, [
            Reservation::STATUS_TENTATIVE,
            Reservation::STATUS_CONFIRMED,
        ])) {
            return response()->json([
                'error' => "Cannot mark no-show for status: {$reservation->status}.",
            ], 422);
        }

        $reservation->update(['status' => Reservation::STATUS_NO_SHOW]);

        // Free the table
        if ($reservation->table_id) {
            Table::where('id', $reservation->table_id)
                ->where('status', Table::STATUS_RESERVED)
                ->update(['status' => Table::STATUS_AVAILABLE]);
        }

        return response()->json([
            'message' => 'Reservation marked as no-show.',
            'data'    => $reservation->fresh(),
        ]);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findForTenant(Request $request, string $id): Reservation
    {
        $tenant      = $request->tenant();
        $reservation = Reservation::forTenant($tenant->id)->find($id);

        if (! $reservation) {
            abort(404, 'Reservation not found.');
        }

        return $reservation;
    }

    private function assertTableOwnership(string $tenantId, string $tableId): void
    {
        if (! Table::where('tenant_id', $tenantId)->where('id', $tableId)->exists()) {
            abort(404, 'Table not found.');
        }
    }
}
