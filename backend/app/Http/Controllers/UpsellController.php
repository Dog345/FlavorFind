<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\UpsellRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UpsellController extends Controller
{
    /**
     * GET /api/upsell/{item_id}
     * Returns active upsell suggestions for a given trigger item.
     * Called by the guest app when an item is added to the cart.
     */
    public function suggest(Request $request, string $itemId): JsonResponse
    {
        $rules = UpsellRule::active()
            ->where('trigger_item_id', $itemId)
            ->with(['suggestedItem' => function ($query) {
                $query->available()->select('id', 'name', 'description', 'base_price', 'image_url', 'allergen_flags');
            }])
            ->get()
            ->filter(fn ($rule) => $rule->suggestedItem !== null) // exclude 86'd items
            ->values();

        return response()->json([
            'trigger_item_id' => $itemId,
            'suggestions'     => $rules->map(fn ($rule) => [
                'rule_id'     => $rule->id,
                'prompt_text' => $rule->prompt_text,
                'item'        => $rule->suggestedItem,
            ]),
        ]);
    }

    /**
     * GET /api/upsell
     * Manager — list all upsell rules for this tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $rules = UpsellRule::with(['triggerItem:id,name', 'suggestedItem:id,name,base_price'])
            ->orderByDesc('priority')
            ->get();

        return response()->json($rules);
    }

    /**
     * POST /api/upsell
     * Manager — create a new upsell rule.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'trigger_item_id'   => 'required|uuid|exists:menu_items,id',
            'suggested_item_id' => 'required|uuid|exists:menu_items,id|different:trigger_item_id',
            'prompt_text'       => 'nullable|string|max:255',
            'priority'          => 'integer|min:0',
        ]);

        $rule = UpsellRule::create([
            'tenant_id'         => $request->tenant()->id,
            'trigger_item_id'   => $request->trigger_item_id,
            'suggested_item_id' => $request->suggested_item_id,
            'prompt_text'       => $request->prompt_text,
            'priority'          => $request->integer('priority', 0),
            'is_active'         => true,
        ]);

        return response()->json($rule->load(['triggerItem:id,name', 'suggestedItem:id,name,base_price']), 201);
    }

    /**
     * DELETE /api/upsell/{id}
     * Manager — remove an upsell rule.
     */
    public function destroy(string $id): JsonResponse
    {
        UpsellRule::findOrFail($id)->delete();

        return response()->json(['message' => 'Upsell rule deleted.']);
    }
}
