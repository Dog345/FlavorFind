<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\UpsellImpression;
use App\Models\UpsellRule;
use App\Services\UpsellService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UpsellRuleController extends Controller
{
    public function __construct(private readonly UpsellService $upsellService)
    {
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/upsell-rules
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $rules = UpsellRule::forTenant($tenant->id)
            ->with([
                'triggerItem:id,name,base_price',
                'suggestedItem:id,name,base_price',
            ])
            ->orderByDesc('priority')
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $rules]);
    }

    /**
     * POST /api/v1/upsell-rules
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'trigger_item_id'   => 'required|string|uuid',
            'suggested_item_id' => 'required|string|uuid|different:trigger_item_id',
            'prompt_text'       => 'sometimes|nullable|string|max:300',
            'priority'          => 'sometimes|integer|min:0|max:100',
            'is_active'         => 'sometimes|boolean',
        ]);

        $this->assertItemOwnership($tenant->id, $data['trigger_item_id']);
        $this->assertItemOwnership($tenant->id, $data['suggested_item_id']);

        // Prevent exact duplicates for this tenant
        $exists = UpsellRule::forTenant($tenant->id)
            ->where('trigger_item_id', $data['trigger_item_id'])
            ->where('suggested_item_id', $data['suggested_item_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'error' => 'An upsell rule for this trigger → suggestion pair already exists.',
            ], 409);
        }

        $rule = UpsellRule::create([
            'tenant_id'         => $tenant->id,
            'trigger_item_id'   => $data['trigger_item_id'],
            'suggested_item_id' => $data['suggested_item_id'],
            'prompt_text'       => $data['prompt_text'] ?? null,
            'priority'          => $data['priority'] ?? 0,
            'is_active'         => $data['is_active'] ?? true,
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
    public function show(Request $request, string $id): JsonResponse
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
    public function update(Request $request, string $id): JsonResponse
    {
        $tenant = $request->tenant();
        $rule   = $this->findForTenant($request, $id);

        $data = $request->validate([
            'trigger_item_id'   => 'sometimes|string|uuid',
            'suggested_item_id' => 'sometimes|string|uuid',
            'prompt_text'       => 'sometimes|nullable|string|max:300',
            'priority'          => 'sometimes|integer|min:0|max:100',
            'is_active'         => 'sometimes|boolean',
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
    public function destroy(Request $request, string $id): JsonResponse
    {
        $rule = $this->findForTenant($request, $id);
        $rule->delete();

        return response()->json(['message' => 'Upsell rule deleted.']);
    }

    // ─── Suggestions ──────────────────────────────────────────────────────────

    /**
     * GET /api/v1/upsell-rules/suggestions
     *
     * Returns merged manual + AI upsell suggestions for the given order.
     * Automatically records impressions so A/B analytics can measure what works.
     *
     * Query params:
     *   item_ids[]  — UUIDs of menu items currently in the order (required)
     *   order_id    — UUID of the order being built (required to record impressions)
     */
    public function suggestions(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'item_ids'   => 'required|array|min:1',
            'item_ids.*' => 'string|uuid',
            'order_id'   => 'sometimes|string|uuid|exists:orders,id',
        ]);

        $itemIds = $data['item_ids'];
        $orderId = $data['order_id'] ?? null;

        $suggestions = $this->upsellService->suggest($tenant->id, $itemIds);

        // Record impressions when we have an order context
        if ($orderId !== null) {
            $this->recordImpressions($tenant->id, $orderId, $suggestions);
        }

        return response()->json([
            'data'  => $suggestions->values(),
            'meta'  => [
                'count'           => $suggestions->count(),
                'impressions_recorded' => $orderId !== null,
            ],
        ]);
    }

    // ─── Impressions ──────────────────────────────────────────────────────────

    /**
     * POST /api/v1/upsell-rules/impressions
     *
     * Manually record an impression (for clients that can't pass order_id
     * to the suggestions endpoint, e.g. guest PWA).
     *
     * Body:
     *   order_id          string UUID
     *   trigger_item_id   string UUID
     *   suggested_item_id string UUID
     *   source            'manual'|'ai'
     *   upsell_rule_id    string UUID (optional, only for manual source)
     *   prompt_text       string (optional)
     */
    public function recordImpression(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'order_id'          => 'required|string|uuid|exists:orders,id',
            'trigger_item_id'   => 'required|string|uuid',
            'suggested_item_id' => 'required|string|uuid',
            'source'            => 'required|in:manual,ai',
            'upsell_rule_id'    => 'sometimes|nullable|string|uuid|exists:upsell_rules,id',
            'prompt_text'       => 'sometimes|nullable|string|max:300',
        ]);

        // Verify the order belongs to this tenant
        $order = Order::where('tenant_id', $tenant->id)->find($data['order_id']);
        if (! $order) {
            return response()->json(['error' => 'Order not found.'], 404);
        }

        $impression = UpsellImpression::create([
            'tenant_id'         => $tenant->id,
            'upsell_rule_id'    => $data['upsell_rule_id'] ?? null,
            'order_id'          => $data['order_id'],
            'trigger_item_id'   => $data['trigger_item_id'],
            'suggested_item_id' => $data['suggested_item_id'],
            'source'            => $data['source'],
            'prompt_text'       => $data['prompt_text'] ?? null,
            'accepted'          => false,
            'shown_at'          => now(),
        ]);

        return response()->json(['data' => $impression], 201);
    }

    /**
     * PATCH /api/v1/upsell-rules/impressions/{impressionId}/accept
     *
     * Mark a suggestion as accepted — guest added the item to the order.
     * Called when the "Add to order" button is tapped on the suggestion card.
     */
    public function acceptImpression(Request $request, string $impressionId): JsonResponse
    {
        $tenant     = $request->tenant();
        $impression = UpsellImpression::forTenant($tenant->id)->find($impressionId);

        if (! $impression) {
            return response()->json(['error' => 'Impression not found.'], 404);
        }

        if ($impression->accepted) {
            return response()->json(['error' => 'Impression already accepted.'], 409);
        }

        $impression->markAccepted();

        return response()->json(['data' => $impression->fresh()]);
    }

    // ─── Analytics ────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/upsell-rules/analytics
     *
     * Returns conversion rates per rule and per source.
     *
     * Optional query params:
     *   date_from  Y-m-d
     *   date_to    Y-m-d
     *   source     'manual'|'ai'
     */
    public function analytics(Request $request): JsonResponse
    {
        $tenant = $request->tenant();

        $data = $request->validate([
            'date_from' => 'sometimes|date|date_format:Y-m-d',
            'date_to'   => 'sometimes|date|date_format:Y-m-d|after_or_equal:date_from',
            'source'    => 'sometimes|in:manual,ai',
        ]);

        $query = UpsellImpression::forTenant($tenant->id);

        if (! empty($data['date_from'])) {
            $query->whereDate('shown_at', '>=', $data['date_from']);
        }
        if (! empty($data['date_to'])) {
            $query->whereDate('shown_at', '<=', $data['date_to']);
        }
        if (! empty($data['source'])) {
            $query->forSource($data['source']);
        }

        // ── Summary by source ─────────────────────────────────────────────────
        $bySource = UpsellImpression::forTenant($tenant->id)
            ->when(! empty($data['date_from']), fn ($q) => $q->whereDate('shown_at', '>=', $data['date_from']))
            ->when(! empty($data['date_to']),   fn ($q) => $q->whereDate('shown_at', '<=', $data['date_to']))
            ->selectRaw('source, COUNT(*) as impressions, SUM(accepted::int) as accepted_count')
            ->groupBy('source')
            ->get()
            ->map(fn ($row) => [
                'source'          => $row->source,
                'impressions'     => (int) $row->impressions,
                'accepted'        => (int) $row->accepted_count,
                'conversion_rate' => $row->impressions > 0
                    ? round($row->accepted_count / $row->impressions * 100, 1)
                    : 0.0,
            ]);

        // ── Per-rule breakdown ────────────────────────────────────────────────
        $byRule = UpsellImpression::forTenant($tenant->id)
            ->when(! empty($data['date_from']), fn ($q) => $q->whereDate('shown_at', '>=', $data['date_from']))
            ->when(! empty($data['date_to']),   fn ($q) => $q->whereDate('shown_at', '<=', $data['date_to']))
            ->whereNotNull('upsell_rule_id')
            ->selectRaw('upsell_rule_id, COUNT(*) as impressions, SUM(accepted::int) as accepted_count')
            ->groupBy('upsell_rule_id')
            ->with('upsellRule.triggerItem:id,name', 'upsellRule.suggestedItem:id,name')
            ->get()
            ->map(fn ($row) => [
                'rule_id'         => $row->upsell_rule_id,
                'trigger_item'    => $row->upsellRule?->triggerItem?->name,
                'suggested_item'  => $row->upsellRule?->suggestedItem?->name,
                'prompt_text'     => $row->upsellRule?->prompt_text,
                'impressions'     => (int) $row->impressions,
                'accepted'        => (int) $row->accepted_count,
                'conversion_rate' => $row->impressions > 0
                    ? round($row->accepted_count / $row->impressions * 100, 1)
                    : 0.0,
            ])
            ->sortByDesc('conversion_rate')
            ->values();

        // ── Totals ────────────────────────────────────────────────────────────
        $totals = $query->selectRaw('COUNT(*) as total, SUM(accepted::int) as total_accepted')
            ->first();

        return response()->json([
            'summary' => [
                'total_impressions'    => (int) ($totals->total ?? 0),
                'total_accepted'       => (int) ($totals->total_accepted ?? 0),
                'overall_conversion'   => ($totals->total ?? 0) > 0
                    ? round($totals->total_accepted / $totals->total * 100, 1)
                    : 0.0,
            ],
            'by_source' => $bySource->values(),
            'by_rule'   => $byRule,
            'filters'   => array_filter([
                'date_from' => $data['date_from'] ?? null,
                'date_to'   => $data['date_to']   ?? null,
                'source'    => $data['source']    ?? null,
            ]),
        ]);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findForTenant(Request $request, string $id): UpsellRule
    {
        $tenant = $request->tenant();
        $rule   = UpsellRule::forTenant($tenant->id)->find($id);

        if (! $rule) {
            abort(404, 'Upsell rule not found.');
        }

        return $rule;
    }

    private function assertItemOwnership(string $tenantId, string $itemId): void
    {
        if (! MenuItem::where('tenant_id', $tenantId)->where('id', $itemId)->exists()) {
            abort(404, "Menu item #{$itemId} not found.");
        }
    }

    /**
     * Bulk-insert impressions for every suggestion returned to the client.
     */
    private function recordImpressions(string $tenantId, string $orderId, \Illuminate\Support\Collection $suggestions): void
    {
        $now  = now();
        $rows = $suggestions->map(fn (array $s) => [
            'id'                => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id'         => $tenantId,
            'upsell_rule_id'    => $s['upsell_rule_id'] ?? null,
            'order_id'          => $orderId,
            'trigger_item_id'   => $s['trigger_item_id'],
            'suggested_item_id' => $s['suggested_item_id'],
            'source'            => $s['source'],
            'prompt_text'       => $s['prompt_text'] ?? null,
            'accepted'          => false,
            'accepted_at'       => null,
            'shown_at'          => $now,
        ])->toArray();

        if (! empty($rows)) {
            UpsellImpression::insert($rows);
        }
    }
}
