<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Table;
use App\Models\TableSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            $query->where('floor_id', $request->string('floor_id'));
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
            'floor_id'   => 'required|string|uuid',
            'label'      => 'required|string|max:50',
            'capacity'   => 'required|integer|min:1|max:100',
            'status'     => 'sometimes|in:' . implode(',', Table::STATUSES),
            'position'   => 'sometimes|array',
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
     */
    public function show(Request $request, string $id): JsonResponse
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
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $tenant = $request->tenant();
        $table  = $this->findForTenant($request, $id);

        $data = $request->validate([
            'floor_id'   => 'sometimes|string|uuid',
            'label'      => 'sometimes|string|max:50',
            'capacity'   => 'sometimes|integer|min:1|max:100',
            'status'     => 'sometimes|in:' . implode(',', Table::STATUSES),
            'position'   => 'sometimes|array',
            'position.x' => 'required_with:position|numeric',
            'position.y' => 'required_with:position|numeric',
            'is_active'  => 'sometimes|boolean',
        ]);

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
     */
    public function destroy(Request $request, string $id): JsonResponse
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
     *
     * Opens a table session. Uses a DB-level lock (SELECT ... FOR UPDATE) to
     * prevent two concurrent requests from opening duplicate sessions on the
     * same table (race condition).
     */
    public function openSession(Request $request, string $id): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'covers'     => 'required|integer|min:1|max:100',
            'guest_name' => 'sometimes|nullable|string|max:100',
        ]);

        $session = DB::transaction(function () use ($tenant, $id, $data, $request) {
            // Lock the table row so concurrent requests are serialised
            $table = Table::forTenant($tenant->id)
                ->lockForUpdate()
                ->find($id);

            if (! $table) {
                abort(404, 'Table not found.');
            }

            if (! $table->isAvailable()) {
                abort(422, "Table is currently '{$table->status}' and cannot be opened.");
            }

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

            return $session;
        });

        return response()->json([
            'data'    => $session->load('table:id,label', 'waiter:id,name'),
            'message' => 'Session opened.',
        ], 201);
    }

    /**
     * POST /api/v1/tables/{id}/close
     *
     * Closes the active session. Blocked if unpaid orders exist —
     * cashier must settle the bill first.
     */
    public function closeSession(Request $request, string $id): JsonResponse
    {
        $table   = $this->findForTenant($request, $id);
        $session = $table->activeSession;

        if (! $session) {
            return response()->json(['error' => 'No open session for this table.'], 422);
        }

        // Block close if any orders on this session are still unpaid
        $unpaidCount = Order::where('session_id', $session->id)
            ->whereNotIn('status', [
                Order::STATUS_PAID,
                Order::STATUS_CANCELLED,
            ])
            ->count();

        if ($unpaidCount > 0) {
            return response()->json([
                'error'        => 'Cannot close session — there are unpaid orders on this table.',
                'unpaid_orders' => $unpaidCount,
            ], 422);
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
     */
    public function sessions(Request $request, string $id): JsonResponse
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

    private function findForTenant(Request $request, string $id): Table
    {
        $tenant = $request->tenant();
        $table  = Table::forTenant($tenant->id)->find($id);

        if (! $table) {
            abort(404, 'Table not found.');
        }

        return $table;
    }
}
