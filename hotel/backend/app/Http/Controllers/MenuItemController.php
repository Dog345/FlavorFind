<?php

namespace App\Http\Controllers;

use App\Models\ItemModifier;
use App\Models\ItemVariant;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    /**
     * GET /api/v1/menu/items
     * List menu items. Filter by category_id, available, search.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $query = MenuItem::forTenant($tenant->id)
            ->with('category:id,name')
            ->ordered();

        if ($request->filled('category_id')) {
            $query->forCategory($request->integer('category_id'));
        }

        if ($request->boolean('available_only')) {
            $query->available();
        }

        if ($request->filled('search')) {
            $search = '%' . $request->string('search') . '%';
            $query->where('name', 'ilike', $search);
        }

        $items = $query->with('variants', 'modifiers')->get();

        return response()->json(['data' => $items]);
    }

    /**
     * POST /api/v1/menu/items
     * Create a menu item (optionally with variants and modifiers).
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'category_id'   => 'required|integer',
            'name'          => 'required|string|max:150',
            'description'   => 'sometimes|nullable|string|max:1000',
            'image_url'     => 'sometimes|nullable|url|max:500',
            'base_price'    => 'required|numeric|min:0',
            'unit'          => 'sometimes|nullable|string|max:50',
            'is_available'  => 'sometimes|boolean',
            'is_active'     => 'sometimes|boolean',
            'prep_time_min' => 'sometimes|integer|min:0|max:180',
            'tags'          => 'sometimes|array',
            'tags.*'        => 'string|max:50',
            'sort_order'    => 'sometimes|integer|min:0',

            // Optional inline variants
            'variants'               => 'sometimes|array',
            'variants.*.name'        => 'required|string|max:100',
            'variants.*.price'       => 'required|numeric|min:0',
            'variants.*.is_available'=> 'sometimes|boolean',
            'variants.*.sort_order'  => 'sometimes|integer|min:0',

            // Optional inline modifiers
            'modifiers'                  => 'sometimes|array',
            'modifiers.*.name'           => 'required|string|max:100',
            'modifiers.*.price_delta'    => 'required|numeric',
            'modifiers.*.is_available'   => 'sometimes|boolean',
            'modifiers.*.sort_order'     => 'sometimes|integer|min:0',
        ]);

        // Verify category belongs to this tenant
        $this->assertCategoryOwnership($tenant->id, $data['category_id']);

        $item = MenuItem::create([
            'tenant_id'     => $tenant->id,
            'category_id'   => $data['category_id'],
            'name'          => $data['name'],
            'description'   => $data['description'] ?? null,
            'image_url'     => $data['image_url'] ?? null,
            'base_price'    => $data['base_price'],
            'unit'          => $data['unit'] ?? null,
            'is_available'  => $data['is_available'] ?? true,
            'is_active'     => $data['is_active'] ?? true,
            'prep_time_min' => $data['prep_time_min'] ?? 10,
            'tags'          => $data['tags'] ?? null,
            'sort_order'    => $data['sort_order'] ?? 0,
        ]);

        // Create variants if provided
        if (! empty($data['variants'])) {
            foreach ($data['variants'] as $i => $v) {
                $item->variants()->create([
                    'name'         => $v['name'],
                    'price'        => $v['price'],
                    'is_available' => $v['is_available'] ?? true,
                    'sort_order'   => $v['sort_order'] ?? $i,
                ]);
            }
        }

        // Create modifiers if provided
        if (! empty($data['modifiers'])) {
            foreach ($data['modifiers'] as $i => $m) {
                $item->modifiers()->create([
                    'name'         => $m['name'],
                    'price_delta'  => $m['price_delta'],
                    'is_available' => $m['is_available'] ?? true,
                    'sort_order'   => $m['sort_order'] ?? $i,
                ]);
            }
        }

        return response()->json([
            'data' => $item->load('category:id,name', 'variants', 'modifiers'),
        ], 201);
    }

    /**
     * GET /api/v1/menu/items/{id}
     * Show a single menu item with variants and modifiers.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $item = $this->findForTenant($request, $id);

        return response()->json([
            'data' => $item->load('category:id,name', 'variants', 'modifiers'),
        ]);
    }

    /**
     * PUT /api/v1/menu/items/{id}
     * Update a menu item.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenant = $request->tenant();
        $item   = $this->findForTenant($request, $id);

        $data = $request->validate([
            'category_id'   => 'sometimes|integer',
            'name'          => 'sometimes|string|max:150',
            'description'   => 'sometimes|nullable|string|max:1000',
            'image_url'     => 'sometimes|nullable|url|max:500',
            'base_price'    => 'sometimes|numeric|min:0',
            'unit'          => 'sometimes|nullable|string|max:50',
            'is_available'  => 'sometimes|boolean',
            'is_active'     => 'sometimes|boolean',
            'prep_time_min' => 'sometimes|integer|min:0|max:180',
            'tags'          => 'sometimes|array',
            'tags.*'        => 'string|max:50',
            'sort_order'    => 'sometimes|integer|min:0',
        ]);

        if (isset($data['category_id'])) {
            $this->assertCategoryOwnership($tenant->id, $data['category_id']);
        }

        $item->update($data);

        return response()->json([
            'data' => $item->load('category:id,name', 'variants', 'modifiers'),
        ]);
    }

    /**
     * DELETE /api/v1/menu/items/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $item = $this->findForTenant($request, $id);
        $item->delete();

        return response()->json(['message' => 'Menu item deleted.']);
    }

    // ─── Variants ─────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/menu/items/{id}/variants
     */
    public function variants(Request $request, int $id): JsonResponse
    {
        $item = $this->findForTenant($request, $id);

        return response()->json(['data' => $item->variants()->ordered()->get()]);
    }

    /**
     * POST /api/v1/menu/items/{id}/variants
     */
    public function storeVariant(Request $request, int $id): JsonResponse
    {
        $item = $this->findForTenant($request, $id);

        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'price'        => 'required|numeric|min:0',
            'is_available' => 'sometimes|boolean',
            'sort_order'   => 'sometimes|integer|min:0',
        ]);

        $variant = $item->variants()->create([
            'name'         => $data['name'],
            'price'        => $data['price'],
            'is_available' => $data['is_available'] ?? true,
            'sort_order'   => $data['sort_order'] ?? 0,
        ]);

        return response()->json(['data' => $variant], 201);
    }

    /**
     * PUT /api/v1/menu/items/{id}/variants/{variantId}
     */
    public function updateVariant(Request $request, int $id, int $variantId): JsonResponse
    {
        $item    = $this->findForTenant($request, $id);
        $variant = $this->findVariant($item, $variantId);

        $data = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'price'        => 'sometimes|numeric|min:0',
            'is_available' => 'sometimes|boolean',
            'sort_order'   => 'sometimes|integer|min:0',
        ]);

        $variant->update($data);

        return response()->json(['data' => $variant]);
    }

    /**
     * DELETE /api/v1/menu/items/{id}/variants/{variantId}
     */
    public function destroyVariant(Request $request, int $id, int $variantId): JsonResponse
    {
        $item    = $this->findForTenant($request, $id);
        $variant = $this->findVariant($item, $variantId);
        $variant->delete();

        return response()->json(['message' => 'Variant deleted.']);
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/menu/items/{id}/modifiers
     */
    public function modifiers(Request $request, int $id): JsonResponse
    {
        $item = $this->findForTenant($request, $id);

        return response()->json(['data' => $item->modifiers()->ordered()->get()]);
    }

    /**
     * POST /api/v1/menu/items/{id}/modifiers
     */
    public function storeModifier(Request $request, int $id): JsonResponse
    {
        $item = $this->findForTenant($request, $id);

        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'price_delta'  => 'required|numeric',
            'is_available' => 'sometimes|boolean',
            'sort_order'   => 'sometimes|integer|min:0',
        ]);

        $modifier = $item->modifiers()->create([
            'name'         => $data['name'],
            'price_delta'  => $data['price_delta'],
            'is_available' => $data['is_available'] ?? true,
            'sort_order'   => $data['sort_order'] ?? 0,
        ]);

        return response()->json(['data' => $modifier], 201);
    }

    /**
     * PUT /api/v1/menu/items/{id}/modifiers/{modifierId}
     */
    public function updateModifier(Request $request, int $id, int $modifierId): JsonResponse
    {
        $item     = $this->findForTenant($request, $id);
        $modifier = $this->findModifier($item, $modifierId);

        $data = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'price_delta'  => 'sometimes|numeric',
            'is_available' => 'sometimes|boolean',
            'sort_order'   => 'sometimes|integer|min:0',
        ]);

        $modifier->update($data);

        return response()->json(['data' => $modifier]);
    }

    /**
     * DELETE /api/v1/menu/items/{id}/modifiers/{modifierId}
     */
    public function destroyModifier(Request $request, int $id, int $modifierId): JsonResponse
    {
        $item     = $this->findForTenant($request, $id);
        $modifier = $this->findModifier($item, $modifierId);
        $modifier->delete();

        return response()->json(['message' => 'Modifier deleted.']);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findForTenant(Request $request, int $id): MenuItem
    {
        $tenant = $request->tenant();
        $item   = MenuItem::forTenant($tenant->id)->find($id);

        if (! $item) {
            abort(404, 'Menu item not found.');
        }

        return $item;
    }

    private function findVariant(MenuItem $item, int $variantId): ItemVariant
    {
        $variant = $item->variants()->find($variantId);
        if (! $variant) {
            abort(404, 'Variant not found.');
        }

        return $variant;
    }

    private function findModifier(MenuItem $item, int $modifierId): ItemModifier
    {
        $modifier = $item->modifiers()->find($modifierId);
        if (! $modifier) {
            abort(404, 'Modifier not found.');
        }

        return $modifier;
    }

    private function assertCategoryOwnership(int $tenantId, int $categoryId): void
    {
        $exists = MenuCategory::forTenant($tenantId)
            ->where('id', $categoryId)
            ->exists();

        if (! $exists) {
            abort(404, 'Category not found.');
        }
    }
}
