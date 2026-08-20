<?php

namespace App\Http\Controllers;

use App\Models\Table;
use App\Models\TableSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TableController extends Controller
{
    /**
     * GET /api/v1/tables
     * List all tables. Optionally filter by floor_id or status.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $query = Table::forTenant($tenant->id)
            ->with('floor:id,name')
            ->with('activeSession');

        if ($request->filled('floor_id')) {
            $query->where('floor_id', $request->integer('floor_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $tables = $query->orderBy('floor_id')->orderBy('label')->get();

        return response()->json(['data' => $tables]);
    }

    /**
     * POST /api/v1/tables
     * Create a new table.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'floor_id' => 'required|integer',
            'label'    => 'required|string|max:50',
            'capacity' => 'required|integer|min:1|max:100',
            'status'   => 'sometimes|in:' . implode(',', Table::STATUSES),
            'position' => 'sometimes|array',
            'position.x' => 'required_with:position|numeric',
            'position.y' => 'required_with:position|numeric',
            'is_active'  => 'sometimes|boolean',
        ]);

        // Ensure floor belongs to this tenant
        $floorExists = \App\Models\Floor::forTenant($tenant->id)
            ->where('id', $data['floor_id'])
            ->exists();

        if (! $floorExists) {
            return response()->json(['error' => 'Floor not found.'], 404);
        }

        $table = Table::create([
            'tenant_id' => $tenant->id,
            'floor_id'  => $data['floor_id'],
            'label'     => $data['label'],
            'capacity'  => $data['capacity'],
            'status'    => $data['status'] ?? Table::STATUS_AVAILABLE,
            'position'  => $data['position'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['data' => $table->load('floor:id,name')], 201);
    }

    /**
     * GET /api/v1/tables/{id}
     * Show a single table with its active session and recent sessions.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $table = $this->findForTenant($request, $id);

        $table->load([
            'floor:id,name',
            'activeSession.waiter:id,name',
            'activeSession.orders',
        ]);

        return response()->json(['data' => $table]);
    }

    /**
     * PUT /api/v1/tables/{id}
     * Update table details.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenant = $request->tenant();
        $table  = $this->findForTenant($request, $id);

        $data = $request->validate([
            'floor_id'   => 'sometimes|integer',
            'label'      => 'sometimes|string|max:50',
            'capacity'   => 'sometimes|integer|min:1|max:100',
            'status'     => 'sometimes|in:' . implode(',', Table::STATUSES),
            'position'   => 'sometimes|array',
            'position.x' => 'required_with:position|numeric',
            'position.y' => 'required_with:position|numeric',
            'is_active'  => 'sometimes|boolean',
        ]);

        // Validate floor ownership if changing floor
        if (isset($data['floor_id'])) {
            $floorExists = \App\Models\Floor::forTenant($tenant->id)
                ->where('id', $data['floor_id'])
                ->exists();
            if (! $floorExists) {
                return response()->json(['error' => 'Floor not found.'], 404);
            }
        }

        $table->update($data);

        return response()->json(['data' => $table->load('floor:id,name')]);
    }

    /**
     * DELETE /api/v1/tables/{id}
     * Delete a table (only if no open session).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $table = $this->findForTenant($request, $id);

        if ($table->activeSession()->exists()) {
            return response()->json([
                'error' => 'Cannot delete a table with an open session. Close the session first.',
            ], 422);
        }

        $table->delete();

        return response()->json(['message' => 'Table deleted.']);
    }

    // ─── Session management ───────────────────────────────────────────────────

    /**
     * POST /api/v1/tables/{id}/open
     * Open a session (guests sit down).
     */
    public function openSession(Request $request, int $id): JsonResponse
    {
        $tenant = $request->tenant();
        $table  = $this->findForTenant($request, $id);

        if (! $table->isAvailable()) {
            return response()->json([
                'error' => "Table is currently '{$table->status}' and cannot be opened.",
            ], 422);
        }

        $data = $request->validate([
            'covers'     => 'required|integer|min:1|max:100',
            'guest_name' => 'sometimes|nullable|string|max:100',
        ]);

        $session = TableSession::create([
            'tenant_id'  => $tenant->id,
            'table_id'   => $table->id,
            'waiter_id'  => $request->user()->id,
            'covers'     => $data['covers'],
            'guest_name' => $data['guest_name'] ?? null,
            'token'      => Str::uuid(),
            'opened_at'  => now(),
        ]);

        $table->update(['status' => Table::STATUS_OCCUPIED]);

        return response()->json([
            'data'    => $session->load('table:id,label', 'waiter:id,name'),
            'message' => 'Session opened.',
        ], 201);
    }

    /**
     * POST /api/v1/tables/{id}/close
     * Close the active session (guests leave / bill settled).
     */
    public function closeSession(Request $request, int $id): JsonResponse
    {
        $table   = $this->findForTenant($request, $id);
        $session = $table->activeSession;

        if (! $session) {
            return response()->json(['error' => 'No open session for this table.'], 422);
        }

        $session->close();
        $table->update(['status' => Table::STATUS_AVAILABLE]);

        return response()->json([
            'data'    => $session->refresh(),
            'message' => 'Session closed.',
        ]);
    }

    /**
     * GET /api/v1/tables/{id}/sessions
     * List past sessions for a table (paginated).
     */
    public function sessions(Request $request, int $id): JsonResponse
    {
        $table = $this->findForTenant($request, $id);

        $sessions = $table->sessions()
            ->with('waiter:id,name')
            ->withCount('orders')
            ->latest('opened_at')
            ->paginate(20);

        return response()->json($sessions);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findForTenant(Request $request, int $id): Table
    {
        $tenant = $request->tenant();
        $table  = Table::forTenant($tenant->id)->find($id);

        if (! $table) {
            abort(404, 'Table not found.');
        }

        return $table;
    }
}
