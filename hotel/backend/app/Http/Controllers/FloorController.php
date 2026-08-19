<?php

namespace App\Http\Controllers;

use App\Models\Floor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FloorController extends Controller
{
    /**
     * GET /api/v1/floors
     * List all floors for the tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $floors = Floor::forTenant($tenant->id)
            ->ordered()
            ->withCount('tables')
            ->get();

        return response()->json(['data' => $floors]);
    }

    /**
     * POST /api/v1/floors
     * Create a new floor.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'sort_order' => 'integer|min:0',
            'is_active'  => 'boolean',
        ]);

        $tenant = $request->tenant();

        $floor = Floor::create([
            'tenant_id'  => $tenant->id,
            'name'       => $data['name'],
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active'  => $data['is_active'] ?? true,
        ]);

        return response()->json(['data' => $floor->loadCount('tables')], 201);
    }

    /**
     * GET /api/v1/floors/{id}
     * Show a single floor with its tables.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $floor = $this->findForTenant($request, $id);

        return response()->json([
            'data' => $floor->load('tables'),
        ]);
    }

    /**
     * PUT /api/v1/floors/{id}
     * Update a floor.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $floor = $this->findForTenant($request, $id);

        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active'  => 'sometimes|boolean',
        ]);

        $floor->update($data);

        return response()->json(['data' => $floor->loadCount('tables')]);
    }

    /**
     * DELETE /api/v1/floors/{id}
     * Delete a floor (only if it has no tables).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $floor = $this->findForTenant($request, $id);

        if ($floor->tables()->exists()) {
            return response()->json([
                'error' => 'Cannot delete a floor that has tables. Remove or reassign tables first.',
            ], 422);
        }

        $floor->delete();

        return response()->json(['message' => 'Floor deleted.']);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findForTenant(Request $request, int $id): Floor
    {
        $tenant = $request->tenant();

        $floor = Floor::forTenant($tenant->id)->find($id);

        if (! $floor) {
            abort(404, 'Floor not found.');
        }

        return $floor;
    }
}
