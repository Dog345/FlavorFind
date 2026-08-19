<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\UpsellRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UpsellRuleController extends Controller
{
    /**
     * GET /api/v1/upsell-rules
     * List all upsell rules for the tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $rules = UpsellRule::forTenant($tenant->id)
            ->with([
                'triggerItem:id,name,base_price',
                'suggestedItem:id,name,base_price',
            ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $rules]);
    }

    /**
     * POST /api/v1/upsell-rules
     * Create an upsell rule.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'trigger_item_id'   => 'required|integer',
            'suggested_item_id' => 'required|integer|different:trigger_item_id',
            'message'           => 'required|string|max:300',
            'discount_pct'      => 'sometimes|numeric|min:0|max:100',
            'is_active'         => 'sometimes|boolean',
            'sort_order'        => 'sometimes|integer|min:0',
        ]);

        // Both items must belong to this tenant
        $this->assertItemOwnership($tenant->id, $data['trigger_item_id']);
        $this->assertItemOwnership($tenant->id, $data['suggested_item_id']);

        $rule = UpsellRule::create([
            'tenant_id'         => $tenant->id,
            'trigger_item_id'   => $data['trigger_item_id'],
            'suggested_item_id' => $data['suggested_item_id'],
            'message'           => $data['message'],
            'discount_pct'      => $data['discount_pct'] ?? 0,
            'is_active'         => $data['is_active'] ?? true,
            'sort_order'        => $data['sort_order'] ?? 0,
        ]);

        return response()->json([
            'data' => $rule->load(
                'triggerItem:id,name,base_price',
                'suggestedItem:id,name,base_price'
            ),
        ], 201);
    }

    /**
     * GET /api/v1/upsell-rules/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $rule = $this->findForTenant($request, $id);

        return response()->json([
            'data' => $rule->load(
                'triggerItem:id,name,base_price,image_url',
                'suggestedItem:id,name,base_price,image_url'
            ),
        ]);
    }

    /**
     * PUT /api/v1/upsell-rules/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenant = $request->tenant();
        $rule   = $this->findForTenant($request, $id);

        $data = $request->validate([
            'trigger_item_id'   => 'sometimes|integer',
            'suggested_item_id' => 'sometimes|integer',
            'message'           => 'sometimes|string|max:300',
            'discount_pct'      => 'sometimes|numeric|min:0|max:100',
            'is_active'         => 'sometimes|boolean',
            'sort_order'        => 'sometimes|integer|min:0',
        ]);

        if (isset($data['trigger_item_id'])) {
            $this->assertItemOwnership($tenant->id, $data['trigger_item_id']);
        }
        if (isset($data['suggested_item_id'])) {
            $this->assertItemOwnership($tenant->id, $data['suggested_item_id']);
        }

        $rule->update($data);

        return response()->json([
            'data' => $rule->load(
                'triggerItem:id,name,base_price',
                'suggestedItem:id,name,base_price'
            ),
        ]);
    }

    /**
     * DELETE /api/v1/upsell-rules/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $rule = $this->findForTenant($request, $id);
        $rule->delete();

        return response()->json(['message' => 'Upsell rule deleted.']);
    }

    /**
     * GET /api/v1/upsell-rules/suggestions?item_ids[]=1&item_ids[]=2
     * Given a list of menu item IDs (e.g. items in the current order),
     * return active upsell suggestions. Used by POS when adding items.
     */
    public function suggestions(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'item_ids'   => 'required|array|min:1',
            'item_ids.*' => 'integer',
        ]);

        $suggestions = UpsellRule::forTenant($tenant->id)
            ->active()
            ->whereIn('trigger_item_id', $data['item_ids'])
            ->with([
                'triggerItem:id,name',
                'suggestedItem:id,name,base_price,image_url,description',
            ])
            ->orderBy('sort_order')
            ->get()
            // Exclude items already in the order
            ->reject(fn ($rule) => in_array($rule->suggested_item_id, $data['item_ids']))
            ->values();

        return response()->json(['data' => $suggestions]);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findForTenant(Request $request, int $id): UpsellRule
    {
        $tenant = $request->tenant();
        $rule   = UpsellRule::forTenant($tenant->id)->find($id);

        if (! $rule) {
            abort(404, 'Upsell rule not found.');
        }

        return $rule;
    }

    private function assertItemOwnership(int $tenantId, int $itemId): void
    {
        $exists = MenuItem::where('tenant_id', $tenantId)->where('id', $itemId)->exists();
        if (! $exists) {
            abort(404, "Menu item #{$itemId} not found.");
        }
    }
}
