<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class IngredientController extends Controller
{
    /**
     * GET /api/ingredients/search?q=chick&limit=10
     *
     * Autocomplete — returns ingredients matching the search query.
     * Ordered by: exact prefix match first, then by how many recipes
     * contain the ingredient (popularity), then alphabetically.
     *
     * Cache: 1 hour per query string (ingredient names don't change)
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q'     => 'required|string|min:1|max:100',
            'limit' => 'integer|min:1|max:50',
        ]);

        $q     = trim($request->q);
        $limit = (int) $request->input('limit', 10);

        $cacheKey = 'ing_search_' . md5(strtolower($q) . '_' . $limit);

        $results = Cache::remember($cacheKey, 3600, function () use ($q, $limit) {
            return DB::select("
                SELECT
                    mi.id::text,
                    mi.name,
                    mi.category,
                    COUNT(ri.recipe_id)::int AS recipe_count,
                    -- Rank: exact prefix match scores higher
                    CASE
                        WHEN lower(mi.name) = lower(:exact)   THEN 0
                        WHEN lower(mi.name) LIKE lower(:start) THEN 1
                        ELSE 2
                    END AS match_rank
                FROM master_ingredients mi
                LEFT JOIN recipe_ingredients ri ON ri.ingredient_id = mi.id
                WHERE mi.name ILIKE :pattern
                GROUP BY mi.id, mi.name, mi.category
                ORDER BY match_rank ASC, recipe_count DESC, mi.name ASC
                LIMIT :limit
            ", [
                'exact'   => $q,
                'start'   => $q . '%',
                'pattern' => '%' . $q . '%',
                'limit'   => $limit,
            ]);
        });

        return response()->json([
            'query'   => $q,
            'results' => $results,
            'count'   => count($results),
        ]);
    }

    /**
     * GET /api/ingredients/{id}/suggestions?limit=10
     *
     * Returns top ingredient suggestions for a single ingredient,
     * sourced from the pre-computed combined_suggestions table.
     *
     * Combined score = 0.6 × co-occurrence + 0.4 × vector similarity
     *
     * Cache: 24 hours (pre-computed table only changes when re-run)
     */
    public function suggestions(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'limit' => 'integer|min:1|max:50',
        ]);

        $limit    = (int) $request->input('limit', 10);
        $cacheKey = 'ing_suggest_' . $id . '_' . $limit;

        // Validate the ingredient exists
        $ingredient = DB::selectOne(
            'SELECT id::text, name, category FROM master_ingredients WHERE id = ?::uuid',
            [$id]
        );

        if (! $ingredient) {
            return response()->json(['error' => 'Ingredient not found.'], 404);
        }

        $suggestions = Cache::remember($cacheKey, 86400, function () use ($id, $limit) {
            return DB::select("
                SELECT
                    cs.suggestion_id::text  AS id,
                    cs.suggestion_name      AS name,
                    cs.suggestion_category  AS category,
                    ROUND(cs.combined_score::numeric, 4)      AS score,
                    ROUND(cs.co_occurrence_score::numeric, 4) AS co_occurrence_score,
                    ROUND(cs.vector_score::numeric, 4)        AS vector_score,
                    cs.rank
                FROM combined_suggestions cs
                WHERE cs.ingredient_id = ?::uuid
                ORDER BY cs.rank ASC
                LIMIT ?
            ", [$id, $limit]);
        });

        return response()->json([
            'ingredient'  => $ingredient,
            'suggestions' => $suggestions,
            'count'       => count($suggestions),
        ]);
    }

    /**
     * GET /api/ingredients/suggest-multi?ids[]=uuid1&ids[]=uuid2&limit=15
     *
     * Given multiple ingredients the user already has, return the best
     * additional ingredients that pair well with ALL of them.
     *
     * Algorithm:
     *   For each candidate ingredient C:
     *     score(C) = average combined_score across all provided anchors
     *              + bonus if C pairs well with multiple anchors (breadth bonus)
     *
     *   Exclude any ingredient already in the input list.
     *   Return top N by aggregated score.
     *
     * This is the core "what goes well with everything I have?" query.
     *
     * Cache: 1 hour per combination of input ids
     */
    public function suggestMulti(Request $request): JsonResponse
    {
        $request->validate([
            'ids'   => 'required|array|min:1|max:10',
            'ids.*' => 'uuid',
            'limit' => 'integer|min:1|max:50',
        ]);

        $ids   = array_unique($request->input('ids'));
        $limit = (int) $request->input('limit', 15);

        // Build a stable cache key from sorted ids
        $sortedIds = $ids;
        sort($sortedIds);
        $cacheKey = 'ing_multi_' . md5(implode(',', $sortedIds) . '_' . $limit);

        // Validate all ingredient ids exist and fetch their names
        $placeholders = implode(',', array_fill(0, count($ids), '?::uuid'));
        $anchors = DB::select(
            "SELECT id::text, name, category FROM master_ingredients WHERE id IN ({$placeholders})",
            $ids
        );

        if (count($anchors) === 0) {
            return response()->json(['error' => 'No valid ingredients found.'], 404);
        }

        $foundIds = array_column($anchors, 'id');

        $suggestions = Cache::remember($cacheKey, 3600, function () use ($foundIds, $limit) {
            $anchorCount   = count($foundIds);
            $placeholders  = implode(',', array_fill(0, $anchorCount, '?::uuid'));

            // Aggregate: average score + breadth bonus
            // breadth_bonus = (appearances_across_anchors / anchor_count) * 0.1
            // This rewards ingredients that pair with MULTIPLE anchors
            return DB::select("
                SELECT
                    cs.suggestion_id::text AS id,
                    cs.suggestion_name     AS name,
                    cs.suggestion_category AS category,
                    COUNT(*)::int          AS anchor_matches,
                    ROUND(AVG(cs.combined_score)::numeric, 4) AS avg_score,
                    ROUND((
                        AVG(cs.combined_score)
                        + (COUNT(*)::float / ?) * 0.1
                    )::numeric, 4) AS final_score
                FROM combined_suggestions cs
                WHERE cs.ingredient_id IN ({$placeholders})
                  AND cs.suggestion_id NOT IN ({$placeholders})
                GROUP BY cs.suggestion_id, cs.suggestion_name, cs.suggestion_category
                ORDER BY final_score DESC, anchor_matches DESC
                LIMIT ?
            ", array_merge(
                [$anchorCount],
                $foundIds,  // anchor IN clause
                $foundIds,  // NOT IN clause (exclude input ingredients)
                [$limit]
            ));
        });

        return response()->json([
            'anchors'     => $anchors,
            'suggestions' => $suggestions,
            'count'       => count($suggestions),
        ]);
    }

    /**
     * GET /api/ingredients/{id}
     *
     * Returns full details for a single ingredient.
     */
    public function show(string $id): JsonResponse
    {
        $ingredient = DB::selectOne("
            SELECT
                mi.id::text,
                mi.name,
                mi.category,
                COUNT(ri.recipe_id)::int AS recipe_count,
                CASE WHEN mi.flavor_vector IS NOT NULL THEN true ELSE false END AS has_embedding
            FROM master_ingredients mi
            LEFT JOIN recipe_ingredients ri ON ri.ingredient_id = mi.id
            WHERE mi.id = ?::uuid
            GROUP BY mi.id, mi.name, mi.category, mi.flavor_vector
        ", [$id]);

        if (! $ingredient) {
            return response()->json(['error' => 'Ingredient not found.'], 404);
        }

        return response()->json($ingredient);
    }
}
