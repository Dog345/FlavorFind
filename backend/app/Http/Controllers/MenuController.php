<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    /**
     * GET /api/menu
     * Public — guests can view the menu without auth.
     * RLS ensures only this tenant's items are returned.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::available()
            ->orderBy('category')
            ->orderBy('sort_order')
            ->orderBy('name');

        // Optional filters
        if ($request->filled('category')) {
            $query->inCategory($request->category);
        }

        if ($request->filled('allergen_exclude')) {
            // Exclude items with specific allergens
            $allergens = explode(',', $request->allergen_exclude);
            foreach ($allergens as $allergen) {
                $query->whereRaw('NOT (? = ANY(allergen_flags))', [trim($allergen)]);
            }
        }

        $items = $query->get();

        return response()->json([
            'tenant' => $request->tenant()->only('name', 'slug', 'logo_url', 'primary_color'),
            'items'  => $items,
        ]);
    }

    /**
     * POST /api/menu
     * Manager only — create a new menu item.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'base_price'     => 'required|numeric|min:0',
            'category'       => 'nullable|string|max:100',
            'image_url'      => 'nullable|url',
            'allergen_flags' => 'nullable|array',
            'allergen_flags.*' => 'string',
            'is_available'   => 'boolean',
            'sort_order'     => 'integer',
        ]);

        $item = MenuItem::create([
            'tenant_id'      => $request->tenant()->id,
            'name'           => $request->name,
            'description'    => $request->description,
            'base_price'     => $request->base_price,
            'category'       => $request->category,
            'image_url'      => $request->image_url,
            'allergen_flags' => $request->allergen_flags ?? [],
            'is_available'   => $request->boolean('is_available', true),
            'sort_order'     => $request->integer('sort_order', 0),
        ]);

        return response()->json($item, 201);
    }

    /**
     * GET /api/menu/{id}
     */
    public function show(string $id): JsonResponse
    {
        $item = MenuItem::findOrFail($id);

        return response()->json($item);
    }

    /**
     * PUT /api/menu/{id}
     * Manager only.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $item = MenuItem::findOrFail($id);

        $request->validate([
            'name'           => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'base_price'     => 'sometimes|numeric|min:0',
            'category'       => 'nullable|string|max:100',
            'image_url'      => 'nullable|url',
            'allergen_flags' => 'nullable|array',
            'is_available'   => 'boolean',
            'sort_order'     => 'integer',
        ]);

        $item->update($request->only([
            'name', 'description', 'base_price', 'category',
            'image_url', 'allergen_flags', 'is_available', 'sort_order',
        ]));

        return response()->json($item);
    }

    /**
     * DELETE /api/menu/{id}
     * Manager only.
     */
    public function destroy(string $id): JsonResponse
    {
        $item = MenuItem::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Menu item deleted.']);
    }

    /**
     * PATCH /api/menu/{id}/toggle
     * Quick in-stock / out-of-stock toggle (86ing).
     */
    public function toggle(string $id): JsonResponse
    {
        $item = MenuItem::findOrFail($id);
        $item->update(['is_available' => ! $item->is_available]);

        return response()->json([
            'id'           => $item->id,
            'is_available' => $item->is_available,
            'message'      => $item->is_available ? 'Item is now available.' : 'Item has been 86\'d.',
        ]);
    }
}
