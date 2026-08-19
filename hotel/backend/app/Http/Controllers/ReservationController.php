<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    /**
     * GET /api/v1/reservations
     * List reservations. Filterable by status, date, today, upcoming.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $query = Reservation::forTenant($tenant->id)
            ->with('table:id,label')
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

        $reservations = $query->paginate(30);

        return response()->json($reservations);
    }

    /**
     * POST /api/v1/reservations
     * Create a new reservation.
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
            'table_id'     => 'sometimes|nullable|integer',
            'notes'        => 'sometimes|nullable|string|max:500',
            'source'       => 'sometimes|in:walk_in,phone,online,app',
        ]);

        // Validate table ownership if provided
        if (! empty($data['table_id'])) {
            $this->assertTableOwnership($tenant->id, $data['table_id']);
        }

        $reservation = Reservation::create([
            'tenant_id'    => $tenant->id,
            'guest_name'   => $data['guest_name'],
            'guest_phone'  => $data['guest_phone'],
            'guest_email'  => $data['guest_email'] ?? null,
            'covers'       => $data['covers'],
            'reserved_at'  => $data['reserved_at'],
            'duration_min' => $data['duration_min'] ?? 90,
            'table_id'     => $data['table_id'] ?? null,
            'notes'        => $data['notes'] ?? null,
            'source'       => $data['source'] ?? 'phone',
            'status'       => Reservation::STATUS_TENTATIVE,
        ]);

        return response()->json([
            'data' => $reservation->load('table:id,label'),
        ], 201);
    }

    /**
     * GET /api/v1/reservations/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        return response()->json([
            'data' => $reservation->load('table:id,label,capacity'),
        ]);
    }

    /**
     * PUT /api/v1/reservations/{id}
     * Update reservation details (guest info, time, table assignment).
     */
    public function update(Request $request, int $id): JsonResponse
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
            'table_id'     => 'sometimes|nullable|integer',
            'notes'        => 'sometimes|nullable|string|max:500',
            'source'       => 'sometimes|in:walk_in,phone,online,app',
        ]);

        if (isset($data['table_id'])) {
            $this->assertTableOwnership($tenant->id, $data['table_id']);
        }

        $reservation->update($data);

        return response()->json([
            'data' => $reservation->load('table:id,label'),
        ]);
    }

    /**
     * POST /api/v1/reservations/{id}/confirm
     * Confirm a tentative reservation.
     */
    public function confirm(Request $request, int $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        if ($reservation->status !== Reservation::STATUS_TENTATIVE) {
            return response()->json([
                'error' => "Only tentative reservations can be confirmed. Current status: {$reservation->status}.",
            ], 422);
        }

        $reservation->confirm();

        return response()->json([
            'message' => 'Reservation confirmed.',
            'data'    => $reservation->fresh()->load('table:id,label'),
        ]);
    }

    /**
     * POST /api/v1/reservations/{id}/arrive
     * Mark guest as arrived — opens their table session.
     */
    public function markArrived(Request $request, int $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        if (! in_array($reservation->status, [Reservation::STATUS_TENTATIVE, Reservation::STATUS_CONFIRMED])) {
            return response()->json([
                'error' => "Cannot mark arrival for a reservation with status: {$reservation->status}.",
            ], 422);
        }

        $reservation->markArrived();

        // Mark the reserved table as occupied if one was assigned
        if ($reservation->table_id) {
            Table::where('id', $reservation->table_id)
                ->update(['status' => Table::STATUS_OCCUPIED]);
        }

        return response()->json([
            'message' => 'Guest marked as arrived.',
            'data'    => $reservation->fresh()->load('table:id,label'),
        ]);
    }

    /**
     * POST /api/v1/reservations/{id}/cancel
     * Cancel a reservation.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        if ($reservation->status === Reservation::STATUS_CANCELLED) {
            return response()->json(['error' => 'Reservation is already cancelled.'], 422);
        }

        if ($reservation->status === Reservation::STATUS_COMPLETED) {
            return response()->json(['error' => 'Cannot cancel a completed reservation.'], 422);
        }

        $data = $request->validate([
            'reason' => 'sometimes|nullable|string|max:300',
        ]);

        $reservation->cancel($data['reason'] ?? null);

        return response()->json([
            'message' => 'Reservation cancelled.',
            'data'    => $reservation->fresh(),
        ]);
    }

    /**
     * PATCH /api/v1/reservations/{id}/no-show
     * Mark as no-show.
     */
    public function noShow(Request $request, int $id): JsonResponse
    {
        $reservation = $this->findForTenant($request, $id);

        if (! in_array($reservation->status, [Reservation::STATUS_TENTATIVE, Reservation::STATUS_CONFIRMED])) {
            return response()->json([
                'error' => "Cannot mark no-show for status: {$reservation->status}.",
            ], 422);
        }

        $reservation->update(['status' => Reservation::STATUS_NO_SHOW]);

        return response()->json([
            'message' => 'Reservation marked as no-show.',
            'data'    => $reservation->fresh(),
        ]);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findForTenant(Request $request, int $id): Reservation
    {
        $tenant      = $request->tenant();
        $reservation = Reservation::forTenant($tenant->id)->find($id);

        if (! $reservation) {
            abort(404, 'Reservation not found.');
        }

        return $reservation;
    }

    private function assertTableOwnership(int $tenantId, int $tableId): void
    {
        $exists = Table::where('tenant_id', $tenantId)->where('id', $tableId)->exists();
        if (! $exists) {
            abort(404, 'Table not found.');
        }
    }
}
