<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuCategoryController extends Controller
{
    /**
     * GET /api/v1/menu/categories
     * List all categories for the tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $categories = MenuCategory::forTenant($tenant->id)
            ->ordered()
            ->withCount('menuItems')
            ->get();

        return response()->json(['data' => $categories]);
    }

    /**
     * POST /api/v1/menu/categories
     * Create a new category.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'sometimes|nullable|string|max:500',
            'image_url'   => 'sometimes|nullable|url|max:500',
            'sort_order'  => 'sometimes|integer|min:0',
            'is_active'   => 'sometimes|boolean',
        ]);

        $tenant = $request->tenant();

        $category = MenuCategory::create([
            'tenant_id'   => $tenant->id,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'image_url'   => $data['image_url'] ?? null,
            'sort_order'  => $data['sort_order'] ?? 0,
            'is_active'   => $data['is_active'] ?? true,
        ]);

        return response()->json(['data' => $category->loadCount('menuItems')], 201);
    }

    /**
     * GET /api/v1/menu/categories/{id}
     * Show a single category with its menu items.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $category = $this->findForTenant($request, $id);

        $category->load([
            'menuItems' => fn ($q) => $q->ordered()->with('variants', 'modifiers'),
        ]);

        return response()->json(['data' => $category]);
    }

    /**
     * PUT /api/v1/menu/categories/{id}
     * Update a category.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = $this->findForTenant($request, $id);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'description' => 'sometimes|nullable|string|max:500',
            'image_url'   => 'sometimes|nullable|url|max:500',
            'sort_order'  => 'sometimes|integer|min:0',
            'is_active'   => 'sometimes|boolean',
        ]);

        $category->update($data);

        return response()->json(['data' => $category->loadCount('menuItems')]);
    }

    /**
     * DELETE /api/v1/menu/categories/{id}
     * Delete a category (only if it has no menu items).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = $this->findForTenant($request, $id);

        if ($category->menuItems()->exists()) {
            return response()->json([
                'error' => 'Cannot delete a category that has menu items. Remove items first.',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findForTenant(Request $request, int $id): MenuCategory
    {
        $tenant   = $request->tenant();
        $category = MenuCategory::forTenant($tenant->id)->find($id);

        if (! $category) {
            abort(404, 'Category not found.');
        }

        return $category;
    }
}
