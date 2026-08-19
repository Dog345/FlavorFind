<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class IngredientController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/ingredients/search",
     *     summary="Search ingredients by name (autocomplete)",
     *     description="Returns ingredients matching the query, ordered by exact match first, then by popularity (recipe count), then alphabetically. Use this to power autocomplete in the UI.",
     *     tags={"Ingredients"},
     *     @OA\Parameter(name="q", in="query", required=true, description="Search term (min 1 char)", @OA\Schema(type="string", example="chick")),
     *     @OA\Parameter(name="limit", in="query", required=false, description="Max results (1–50, default 10)", @OA\Schema(type="integer", example=10)),
     *     @OA\Response(
     *         response=200,
     *         description="Matching ingredients",
     *         @OA\JsonContent(
     *             @OA\Property(property="query", type="string", example="chick"),
     *             @OA\Property(property="results", type="array", @OA\Items(ref="#/components/schemas/IngredientWithCount")),
     *             @OA\Property(property="count", type="integer", example=10)
     *         )
     *     ),
     *     @OA\Response(response=422, description="Validation error")
     * )
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
                    id::text,
                    name,
                    category,
                    recipe_count,
                    CASE
                        WHEN lower(name) = lower(:exact)   THEN 0
                        WHEN lower(name) LIKE lower(:start) THEN 1
                        ELSE 2
                    END AS match_rank
                FROM master_ingredients
                WHERE name ILIKE :pattern
                ORDER BY match_rank ASC, recipe_count DESC, name ASC
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
     * @OA\Get(
     *     path="/api/v1/ingredients/{id}/suggestions",
     *     summary="Get ingredient pairing suggestions for one ingredient",
     *     description="Returns the top ingredients that pair well with the given ingredient. Scores combine co-occurrence (60%) — how often they appear together in recipes — and vector similarity (40%) — semantic closeness. Results are pre-computed for instant response.",
     *     tags={"Ingredients"},
     *     @OA\Parameter(name="id", in="path", required=true, description="Ingredient UUID", @OA\Schema(type="string", format="uuid", example="7bb3db1c-27bf-499e-9945-7ed92bdc16f5")),
     *     @OA\Parameter(name="limit", in="query", required=false, description="Max suggestions (1–50, default 10)", @OA\Schema(type="integer", example=10)),
     *     @OA\Response(
     *         response=200,
     *         description="Ingredient suggestions",
     *         @OA\JsonContent(
     *             @OA\Property(property="ingredient", ref="#/components/schemas/Ingredient"),
     *             @OA\Property(property="suggestions", type="array", @OA\Items(ref="#/components/schemas/Suggestion")),
     *             @OA\Property(property="count", type="integer", example=10)
     *         )
     *     ),
     *     @OA\Response(response=404, description="Ingredient not found", @OA\JsonContent(ref="#/components/schemas/Error"))
     * )
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
     * @OA\Get(
     *     path="/api/v1/ingredients/suggest-multi",
     *     summary="Get ingredient suggestions for multiple ingredients at once",
     *     description="The core FlavorFind feature. Given 1–10 ingredients you already have, returns the best additional ingredients that pair well with ALL of them simultaneously. Results are ranked by average pairing score plus a breadth bonus that rewards ingredients pairing with multiple anchors.",
     *     tags={"Ingredients"},
     *     @OA\Parameter(name="ids[]", in="query", required=true, description="Array of ingredient UUIDs (1–10)", @OA\Schema(type="array", @OA\Items(type="string", format="uuid")), style="form", explode=true),
     *     @OA\Parameter(name="limit", in="query", required=false, description="Max suggestions (1–50, default 15)", @OA\Schema(type="integer", example=15)),
     *     @OA\Response(
     *         response=200,
     *         description="Multi-ingredient suggestions",
     *         @OA\JsonContent(
     *             @OA\Property(property="anchors", type="array", @OA\Items(ref="#/components/schemas/Ingredient"), description="The ingredients you provided"),
     *             @OA\Property(property="suggestions", type="array", @OA\Items(ref="#/components/schemas/MultiSuggestion")),
     *             @OA\Property(property="count", type="integer", example=15)
     *         )
     *     ),
     *     @OA\Response(response=404, description="No valid ingredients found", @OA\JsonContent(ref="#/components/schemas/Error")),
     *     @OA\Response(response=422, description="Validation error")
     * )
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
     * @OA\Get(
     *     path="/api/v1/ingredients/{id}",
     *     summary="Get a single ingredient by ID",
     *     tags={"Ingredients"},
     *     @OA\Parameter(name="id", in="path", required=true, description="Ingredient UUID", @OA\Schema(type="string", format="uuid", example="7bb3db1c-27bf-499e-9945-7ed92bdc16f5")),
     *     @OA\Response(
     *         response=200,
     *         description="Ingredient detail",
     *         @OA\JsonContent(
     *             allOf={@OA\Schema(ref="#/components/schemas/Ingredient")},
     *             @OA\Property(property="recipe_count", type="integer", example=5903),
     *             @OA\Property(property="has_embedding", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(response=404, description="Not found", @OA\JsonContent(ref="#/components/schemas/Error"))
     * )
     */
    public function show(string $id): JsonResponse
    {
        $ingredient = DB::selectOne("
            SELECT
                id::text,
                name,
                category,
                recipe_count,
                CASE WHEN flavor_vector IS NOT NULL THEN true ELSE false END AS has_embedding
            FROM master_ingredients
            WHERE id = ?::uuid
        ", [$id]);

        if (! $ingredient) {
            return response()->json(['error' => 'Ingredient not found.'], 404);
        }

        return response()->json($ingredient);
    }
}
