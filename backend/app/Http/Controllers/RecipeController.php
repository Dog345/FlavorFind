<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class RecipeController extends Controller
{
    /**
     * GET /api/v1/recipes/search
     *
     * Search recipes by ingredients. Supports two modes:
     *
     *   mode=any  (default) — recipes that contain AT LEAST ONE of the given
     *             ingredients, ranked by how many they match (most matches first).
     *             Good for "I have chicken — show me anything with chicken."
     *
     *   mode=all  — recipes that contain ALL the given ingredients.
     *             Good for "I have chicken + garlic + onion — what can I make exactly?"
     *
     * Additional filters: category, min_rating, max_calories, q (text search)
     *
     * Query params:
     *   ingredient_ids[] — UUID list (required, max 15)
     *   mode             — "any" | "all"  (default: "any")
     *   category         — string, e.g. "Chicken Breast"
     *   min_rating       — numeric 1-5
     *   max_calories     — numeric
     *   q                — free text search on name + description
     *   limit            — 1-50 (default 20)
     *   page             — 1-based (default 1)
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'ingredient_ids'   => 'required|array|min:1|max:15',
            'ingredient_ids.*' => 'uuid',
            'mode'             => 'in:any,all',
            'category'         => 'nullable|string|max:100',
            'min_rating'       => 'nullable|numeric|min:1|max:5',
            'max_calories'     => 'nullable|numeric|min:0',
            'q'                => 'nullable|string|max:200',
            'limit'            => 'integer|min:1|max:50',
            'page'             => 'integer|min:1',
        ]);

        $ingredientIds = array_unique($request->input('ingredient_ids'));
        $mode          = $request->input('mode', 'any');
        $category      = $request->input('category');
        $minRating     = $request->input('min_rating');
        $maxCalories   = $request->input('max_calories');
        $q             = $request->input('q');
        $limit         = (int) $request->input('limit', 20);
        $page          = (int) $request->input('page', 1);
        $offset        = ($page - 1) * $limit;

        // Build cache key from all inputs
        $cacheKey = 'recipe_search_' . md5(json_encode([
            $ingredientIds, $mode, $category, $minRating, $maxCalories, $q, $limit, $page
        ]));

        $result = Cache::remember($cacheKey, 600, function () use (
            $ingredientIds, $mode, $category, $minRating,
            $maxCalories, $q, $limit, $offset
        ) {
            $ingCount     = count($ingredientIds);
            $ingPlaceholders = implode(',', array_fill(0, $ingCount, '?::uuid'));

            // Build optional WHERE clauses
            $filters    = [];
            $filterArgs = [];

            if ($category) {
                $filters[]    = 'r.category ILIKE ?';
                $filterArgs[] = '%' . $category . '%';
            }
            if ($minRating !== null) {
                $filters[]    = 'r.rating >= ?';
                $filterArgs[] = $minRating;
            }
            if ($maxCalories !== null) {
                $filters[]    = 'r.calories <= ?';
                $filterArgs[] = $maxCalories;
            }
            if ($q) {
                // Use the GIN full-text index
                $filters[]    = "to_tsvector('english', coalesce(r.name,'') || ' ' || coalesce(r.description,'')) @@ plainto_tsquery('english', ?)";
                $filterArgs[] = $q;
            }

            $filterSql = $filters ? ('AND ' . implode(' AND ', $filters)) : '';

            if ($mode === 'all') {
                // Recipes that have ALL the requested ingredients.
                // We use HAVING COUNT(DISTINCT ingredient_id) = N so we need exactly
                // N distinct ingredient matches per recipe.
                $sql = "
                    SELECT
                        r.id::text,
                        r.name,
                        r.category,
                        r.description,
                        r.prep_time,
                        r.cook_time,
                        r.total_time,
                        r.servings,
                        r.rating,
                        r.review_count,
                        r.calories,
                        {$ingCount} AS matched_count,
                        {$ingCount} AS total_searched
                    FROM recipes r
                    WHERE EXISTS (
                        SELECT 1 FROM recipe_ingredients ri
                        WHERE ri.recipe_id = r.id
                          AND ri.ingredient_id IN ({$ingPlaceholders})
                        HAVING COUNT(DISTINCT ri.ingredient_id) = {$ingCount}
                    )
                    {$filterSql}
                    ORDER BY r.rating DESC NULLS LAST, r.review_count DESC
                    LIMIT ? OFFSET ?
                ";

                $args = array_merge($ingredientIds, $filterArgs, [$limit, $offset]);

            } else {
                // mode=any — rank by how many of the searched ingredients appear
                $sql = "
                    SELECT
                        r.id::text,
                        r.name,
                        r.category,
                        r.description,
                        r.prep_time,
                        r.cook_time,
                        r.total_time,
                        r.servings,
                        r.rating,
                        r.review_count,
                        r.calories,
                        ri_match.matched_count,
                        {$ingCount} AS total_searched
                    FROM recipes r
                    JOIN (
                        SELECT recipe_id, COUNT(DISTINCT ingredient_id)::int AS matched_count
                        FROM recipe_ingredients
                        WHERE ingredient_id IN ({$ingPlaceholders})
                        GROUP BY recipe_id
                    ) ri_match ON ri_match.recipe_id = r.id
                    WHERE 1=1 {$filterSql}
                    ORDER BY ri_match.matched_count DESC, r.rating DESC NULLS LAST, r.review_count DESC
                    LIMIT ? OFFSET ?
                ";

                $args = array_merge($ingredientIds, $filterArgs, [$limit, $offset]);
            }

            $recipes = DB::select($sql, $args);

            // Count total for pagination (same filters, no LIMIT/OFFSET)
            if ($mode === 'all') {
                $countSql = "
                    SELECT COUNT(*)::int AS total
                    FROM recipes r
                    WHERE EXISTS (
                        SELECT 1 FROM recipe_ingredients ri
                        WHERE ri.recipe_id = r.id
                          AND ri.ingredient_id IN ({$ingPlaceholders})
                        HAVING COUNT(DISTINCT ri.ingredient_id) = {$ingCount}
                    )
                    {$filterSql}
                ";
                $countArgs = array_merge($ingredientIds, $filterArgs);
            } else {
                $countSql = "
                    SELECT COUNT(*)::int AS total
                    FROM recipes r
                    JOIN (
                        SELECT recipe_id
                        FROM recipe_ingredients
                        WHERE ingredient_id IN ({$ingPlaceholders})
                        GROUP BY recipe_id
                    ) ri_match ON ri_match.recipe_id = r.id
                    WHERE 1=1 {$filterSql}
                ";
                $countArgs = array_merge($ingredientIds, $filterArgs);
            }

            $total = DB::selectOne($countSql, $countArgs)->total ?? 0;

            return compact('recipes', 'total');
        });

        return response()->json([
            'mode'        => $mode,
            'results'     => $result['recipes'],
            'pagination'  => [
                'total'        => $result['total'],
                'per_page'     => $limit,
                'current_page' => $page,
                'last_page'    => (int) ceil($result['total'] / $limit),
            ],
        ]);
    }

    /**
     * GET /api/v1/recipes/categories
     *
     * Returns all distinct recipe categories with recipe count,
     * ordered by count descending. Used for browse/filter UI.
     *
     * Cache: 1 hour (categories don't change often)
     */
    public function categories(): JsonResponse
    {
        $categories = Cache::remember('recipe_categories', 3600, function () {
            return DB::select("
                SELECT
                    category,
                    COUNT(*)::int AS recipe_count
                FROM recipes
                WHERE category IS NOT NULL
                GROUP BY category
                ORDER BY recipe_count DESC
            ");
        });

        return response()->json([
            'categories' => $categories,
            'count'      => count($categories),
        ]);
    }

    /**
     * GET /api/v1/recipes/{id}
     *
     * Full recipe detail including all ingredients with quantities.
     *
     * Cache: 24 hours (recipe data is static)
     */
    public function show(string $id): JsonResponse
    {
        $cacheKey = 'recipe_detail_' . $id;

        $recipe = Cache::remember($cacheKey, 86400, function () use ($id) {
            $row = DB::selectOne("
                SELECT
                    r.id::text,
                    r.name,
                    r.category,
                    r.description,
                    r.prep_time,
                    r.cook_time,
                    r.total_time,
                    r.servings,
                    r.yield,
                    r.instructions,
                    r.keywords,
                    r.rating,
                    r.review_count,
                    r.calories,
                    r.protein_g,
                    r.fat_g,
                    r.carbs_g,
                    r.fiber_g,
                    r.sugar_g,
                    r.cholesterol_mg,
                    r.sodium_mg,
                    r.saturated_fat_g
                FROM recipes r
                WHERE r.id = ?::uuid
            ", [$id]);

            if (! $row) {
                return null;
            }

            // Decode JSON fields (DB returns raw JSON strings)
            $row->instructions = json_decode($row->instructions, true) ?? [];
            $row->keywords     = json_decode($row->keywords, true) ?? [];

            // Fetch ingredients with quantities
            $ingredients = DB::select("
                SELECT
                    mi.id::text,
                    mi.name,
                    mi.category,
                    ri.quantity,
                    ri.quantity_numeric,
                    ri.unit,
                    ri.sort_order
                FROM recipe_ingredients ri
                JOIN master_ingredients mi ON mi.id = ri.ingredient_id
                WHERE ri.recipe_id = ?::uuid
                ORDER BY ri.sort_order ASC
            ", [$id]);

            $row->ingredients = $ingredients;

            return $row;
        });

        if (! $recipe) {
            return response()->json(['error' => 'Recipe not found.'], 404);
        }

        return response()->json($recipe);
    }
}
