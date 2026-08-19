<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class RecipeController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/recipes/search",
     *     summary="Search recipes by ingredients",
     *     description="Find recipes that contain your ingredients. Two modes: **any** (default) returns recipes with at least one match, ranked by how many ingredients match. **all** returns only recipes that contain every ingredient you listed.",
     *     tags={"Recipes"},
     *     @OA\Parameter(name="ingredient_ids[]", in="query", required=true, description="Ingredient UUIDs to search with (1–15)", @OA\Schema(type="array", @OA\Items(type="string", format="uuid")), style="form", explode=true),
     *     @OA\Parameter(name="mode", in="query", required=false, description="'any' = at least one match (default). 'all' = must contain every ingredient.", @OA\Schema(type="string", enum={"any","all"}, example="any")),
     *     @OA\Parameter(name="category", in="query", required=false, description="Filter by recipe category (partial match)", @OA\Schema(type="string", example="Chicken")),
     *     @OA\Parameter(name="min_rating", in="query", required=false, description="Minimum recipe rating (1–5)", @OA\Schema(type="number", example=4.0)),
     *     @OA\Parameter(name="max_calories", in="query", required=false, description="Maximum calories per serving", @OA\Schema(type="number", example=500)),
     *     @OA\Parameter(name="q", in="query", required=false, description="Full-text search on recipe name and description", @OA\Schema(type="string", example="spicy")),
     *     @OA\Parameter(name="limit", in="query", required=false, description="Results per page (1–50, default 20)", @OA\Schema(type="integer", example=20)),
     *     @OA\Parameter(name="page", in="query", required=false, description="Page number (default 1)", @OA\Schema(type="integer", example=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Recipe search results",
     *         @OA\JsonContent(
     *             @OA\Property(property="mode", type="string", example="any"),
     *             @OA\Property(property="results", type="array", @OA\Items(ref="#/components/schemas/RecipeSummary")),
     *             @OA\Property(property="pagination", ref="#/components/schemas/Pagination")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Validation error")
     * )
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
                // Image LATERAL is applied AFTER the LIMIT via a wrapping subquery —
                // this prevents 34K+ image lookups before pagination.
                $sql = "
                    SELECT
                        base.id,
                        base.name,
                        base.category,
                        base.description,
                        base.prep_time,
                        base.cook_time,
                        base.total_time,
                        base.servings,
                        base.rating,
                        base.review_count,
                        base.calories,
                        base.matched_count,
                        base.total_searched,
                        img.url AS image_url
                    FROM (
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
                    ) base
                    LEFT JOIN LATERAL (
                        SELECT url FROM recipe_images
                        WHERE recipe_id = base.id::uuid
                        ORDER BY sort_order ASC
                        LIMIT 1
                    ) img ON true
                ";

                $args = array_merge($ingredientIds, $filterArgs, [$limit, $offset]);

            } else {
                // mode=any — rank by how many of the searched ingredients appear.
                // Image LATERAL is applied AFTER the LIMIT via a wrapping subquery.
                $sql = "
                    SELECT
                        base.id,
                        base.name,
                        base.category,
                        base.description,
                        base.prep_time,
                        base.cook_time,
                        base.total_time,
                        base.servings,
                        base.rating,
                        base.review_count,
                        base.calories,
                        base.matched_count,
                        base.total_searched,
                        img.url AS image_url
                    FROM (
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
                    ) base
                    LEFT JOIN LATERAL (
                        SELECT url FROM recipe_images
                        WHERE recipe_id = base.id::uuid
                        ORDER BY sort_order ASC
                        LIMIT 1
                    ) img ON true
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
     * @OA\Get(
     *     path="/api/v1/recipes/categories",
     *     summary="List all recipe categories",
     *     description="Returns all distinct recipe categories with their recipe counts, ordered by count descending. Use this to build a browse/filter UI.",
     *     tags={"Recipes"},
     *     @OA\Response(
     *         response=200,
     *         description="Category list",
     *         @OA\JsonContent(
     *             @OA\Property(property="categories", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="category", type="string", example="Dessert"),
     *                     @OA\Property(property="recipe_count", type="integer", example=61338)
     *                 )
     *             ),
     *             @OA\Property(property="count", type="integer", example=316)
     *         )
     *     )
     * )
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
     * @OA\Get(
     *     path="/api/v1/recipes/{id}",
     *     summary="Get full recipe detail",
     *     description="Returns complete recipe information including step-by-step instructions, full ingredient list with quantities and units, and detailed nutrition data.",
     *     tags={"Recipes"},
     *     @OA\Parameter(name="id", in="path", required=true, description="Recipe UUID", @OA\Schema(type="string", format="uuid", example="7db8181c-86ff-4fae-bd4c-998c172237dd")),
     *     @OA\Response(
     *         response=200,
     *         description="Full recipe detail",
     *         @OA\JsonContent(ref="#/components/schemas/RecipeDetail")
     *     ),
     *     @OA\Response(response=404, description="Recipe not found", @OA\JsonContent(ref="#/components/schemas/Error"))
     * )
     */
    public function show(string $id): JsonResponse
    {
        // Validate UUID format before hitting the DB — prevents Postgres cast errors
        if (! preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
            return response()->json(['error' => 'Recipe not found.'], 404);
        }

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

            // Fetch images ordered by sort_order
            $images = DB::select("
                SELECT url, sort_order
                FROM recipe_images
                WHERE recipe_id = ?::uuid
                ORDER BY sort_order ASC
            ", [$id]);

            $row->images    = $images;
            $row->image_url = count($images) > 0 ? $images[0]->url : null;

            return $row;
        });

        if (! $recipe) {
            return response()->json(['error' => 'Recipe not found.'], 404);
        }

        return response()->json($recipe);
    }
}
