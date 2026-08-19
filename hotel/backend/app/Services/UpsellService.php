<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\UpsellRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * UpsellService — surfaces upsell suggestions for a set of order items.
 *
 * Strategy (priority order):
 *  1. Manual rules  — UpsellRule rows configured by the manager (instant, no DB hop)
 *  2. AI pairing    — FlavorFind recipes DB ingredient co-occurrence lookup
 *
 * Both sources are merged and de-duplicated. Items already in the order are
 * excluded. Results are capped to MAX_SUGGESTIONS to avoid overwhelming the UI.
 *
 * FlavorFind pairing logic:
 *  - Looks up which FlavorFind recipe IDs share ingredients with the trigger items
 *  - Finds hotel menu items whose flavorfind_recipe_id matches those recipe IDs
 *  - This gives "scientifically" paired dishes without any ML model at runtime
 *  - Results are cached per trigger-item-set for 10 minutes
 */
class UpsellService
{
    public const MAX_SUGGESTIONS = 5;

    /**
     * Return merged upsell suggestions for a given set of menu item IDs.
     *
     * @param  string   $tenantId   UUID
     * @param  string[] $itemIds    Menu item UUIDs currently in the order
     * @return Collection<int, array>  Suggestion DTOs
     */
    public function suggest(string $tenantId, array $itemIds): Collection
    {
        $itemIds = array_values(array_unique($itemIds));

        $manualSuggestions = $this->getManualSuggestions($tenantId, $itemIds);
        $aiSuggestions     = $this->getAiSuggestions($tenantId, $itemIds);

        // Merge: manual first (manager intent > AI), then AI novelties
        $seen   = [];
        $merged = collect();

        foreach ($manualSuggestions->concat($aiSuggestions) as $suggestion) {
            $key = $suggestion['suggested_item_id'];
            // Skip if already in the order or already suggested
            if (in_array($key, $itemIds, true) || isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $merged->push($suggestion);

            if ($merged->count() >= self::MAX_SUGGESTIONS) {
                break;
            }
        }

        return $merged;
    }

    // ─── Manual rules ─────────────────────────────────────────────────────────

    /**
     * Pull active UpsellRule rows that match any of the trigger item IDs.
     */
    public function getManualSuggestions(string $tenantId, array $itemIds): Collection
    {
        if (empty($itemIds)) {
            return collect();
        }

        return UpsellRule::forTenant($tenantId)
            ->active()
            ->whereIn('trigger_item_id', $itemIds)
            ->with([
                'triggerItem:id,name',
                'suggestedItem:id,name,base_price,image_url,description',
            ])
            ->orderByDesc('priority')
            ->get()
            ->map(fn (UpsellRule $rule) => [
                'source'             => 'manual',
                'upsell_rule_id'     => $rule->id,
                'trigger_item_id'    => $rule->trigger_item_id,
                'suggested_item_id'  => $rule->suggested_item_id,
                'suggested_item'     => $rule->suggestedItem,
                'prompt_text'        => $rule->prompt_text,
                'confidence'         => null,
            ]);
    }

    // ─── FlavorFind AI pairing ────────────────────────────────────────────────

    /**
     * Derive AI-paired suggestions by querying the FlavorFind recipe DB.
     *
     * The query:
     *  1. Finds the flavorfind_recipe_id for each trigger menu item
     *  2. Reads the ingredient list for those recipes from the flavorfind DB
     *  3. Finds OTHER recipes that share the most ingredients (co-occurrence)
     *  4. Maps those recipe IDs back to hotel menu items via flavorfind_recipe_id
     *
     * Gracefully returns empty if the flavorfind connection is unavailable.
     */
    public function getAiSuggestions(string $tenantId, array $itemIds): Collection
    {
        if (empty($itemIds)) {
            return collect();
        }

        try {
            // Step 1: Get the FlavorFind recipe IDs for the trigger items
            $triggerRecipeIds = MenuItem::where('tenant_id', $tenantId)
                ->whereIn('id', $itemIds)
                ->whereNotNull('flavorfind_recipe_id')
                ->pluck('flavorfind_recipe_id')
                ->filter()
                ->values()
                ->toArray();

            if (empty($triggerRecipeIds)) {
                return collect(); // No FlavorFind linkage — skip AI path
            }

            // Cache key based on the sorted recipe IDs
            $cacheKey = 'upsell_ai_' . md5(implode(',', $triggerRecipeIds));

            $pairedRecipeIds = Cache::remember($cacheKey, 600, function () use ($triggerRecipeIds) {
                return $this->findPairedRecipes($triggerRecipeIds);
            });

            if (empty($pairedRecipeIds)) {
                return collect();
            }

            // Step 2: Map paired recipe IDs back to hotel menu items for this tenant
            $pairedItems = MenuItem::where('tenant_id', $tenantId)
                ->whereIn('flavorfind_recipe_id', array_keys($pairedRecipeIds))
                ->where('is_available', true)
                ->select('id', 'name', 'base_price', 'image_url', 'description', 'flavorfind_recipe_id')
                ->get();

            return $pairedItems->map(fn (MenuItem $item) => [
                'source'             => 'ai',
                'upsell_rule_id'     => null,
                'trigger_item_id'    => $itemIds[0], // associate with first trigger
                'suggested_item_id'  => $item->id,
                'suggested_item'     => $item,
                'prompt_text'        => "Guests who ordered this also enjoyed {$item->name}.",
                'confidence'         => $pairedRecipeIds[$item->flavorfind_recipe_id] ?? null,
            ])->sortByDesc('confidence')->values();

        } catch (\Throwable $e) {
            // FlavorFind DB unavailable — degrade gracefully, log for ops
            Log::warning('UpsellService: FlavorFind AI pairing failed', [
                'error'    => $e->getMessage(),
                'item_ids' => $itemIds,
            ]);

            return collect();
        }
    }

    /**
     * Query the FlavorFind DB for recipes that co-occur with trigger recipes.
     *
     * Uses ingredient overlap as the similarity signal:
     *  - Extract ingredient names from trigger recipes
     *  - Find other recipes that share those ingredients
     *  - Score by number of shared ingredients (higher = more relevant)
     *  - Return top 10 recipe IDs with their scores
     *
     * @param  int[]  $triggerRecipeIds   IDs from the flavorfind.recipes table
     * @return array<int, int>  [recipe_id => shared_ingredient_count]
     */
    private function findPairedRecipes(array $triggerRecipeIds): array
    {
        $ff = DB::connection('flavorfind');

        // The ingredients column in recipes_import is JSONB: {"list": ["item1", "item2"]}
        // Extract ingredient names from trigger recipes
        $triggerIngredients = $ff->table('recipes')
            ->whereIn('id', $triggerRecipeIds)
            ->pluck('ingredients')
            ->flatMap(function ($raw) {
                $data = is_string($raw) ? json_decode($raw, true) : $raw;
                return $data['list'] ?? [];
            })
            ->map(fn (string $ing) => strtolower(trim($ing)))
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        if (empty($triggerIngredients)) {
            return [];
        }

        // Find other recipes sharing those ingredients
        // We build a LIKE match per ingredient against the jsonb text representation
        $query = $ff->table('recipes')
            ->whereNotIn('id', $triggerRecipeIds)
            ->select('id', 'ingredients');

        $rows = $query->get();

        $scores = [];
        foreach ($rows as $row) {
            $data = is_string($row->ingredients)
                ? json_decode($row->ingredients, true)
                : (array) $row->ingredients;

            $recipeIngredients = array_map(
                fn (string $i) => strtolower(trim($i)),
                $data['list'] ?? []
            );

            $shared = count(array_intersect($triggerIngredients, $recipeIngredients));

            if ($shared > 0) {
                $scores[$row->id] = $shared;
            }
        }

        // Sort by score descending, take top 10
        arsort($scores);
        return array_slice($scores, 0, 10, true);
    }
}
