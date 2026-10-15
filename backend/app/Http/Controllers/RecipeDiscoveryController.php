<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * RecipeDiscoveryController
 *
 * Handles all "discovery" endpoints that the frontend uses to populate
 * sections without requiring the user to search by ingredient.
 *
 * All endpoints are fully deterministic — the same request always returns
 * the same result within its time window (day / week), so caching is safe.
 *
 * Ordering note: all 150 recipes share the same created_at timestamp.
 * source_id (sequential from 9000000) is the meaningful ordering field.
 */
class RecipeDiscoveryController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // Shared helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Standard recipe summary columns used across all list endpoints.
     * Includes a LATERAL join for the first image.
     */
    private function summarySelect(string $alias = 'r'): string
    {
        return "
            {$alias}.id::text,
            {$alias}.name,
            {$alias}.category,
            {$alias}.description,
            {$alias}.prep_time,
            {$alias}.cook_time,
            {$alias}.total_time,
            {$alias}.servings,
            {$alias}.rating,
            {$alias}.review_count,
            {$alias}.calories,
            {$alias}.source_id,
            img.url AS image_url
        ";
    }

    /**
     * Full recipe detail columns (same as RecipeController::show).
     */
    private function detailSelect(string $alias = 'r'): string
    {
        return "
            {$alias}.id::text,
            {$alias}.name,
            {$alias}.category,
            {$alias}.description,
            {$alias}.prep_time,
            {$alias}.cook_time,
            {$alias}.total_time,
            {$alias}.servings,
            {$alias}.yield,
            {$alias}.instructions,
            {$alias}.keywords,
            {$alias}.rating,
            {$alias}.review_count,
            {$alias}.calories,
            {$alias}.protein_g,
            {$alias}.fat_g,
            {$alias}.carbs_g,
            {$alias}.fiber_g,
            {$alias}.sugar_g,
            {$alias}.cholesterol_mg,
            {$alias}.sodium_mg,
            {$alias}.saturated_fat_g,
            {$alias}.source_id
        ";
    }

    /**
     * Fetch and attach ingredients + images to a detail row (array).
     */
    private function attachDetail(array $row): array
    {
        $id = $row['id'];

        $row['instructions'] = json_decode($row['instructions'] ?? '[]', true) ?? [];
        $row['keywords']     = json_decode($row['keywords']     ?? '[]', true) ?? [];

        $row['ingredients'] = array_map(
            fn($r) => (array) $r,
            DB::select("
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
            ", [$id])
        );

        $images = array_map(
            fn($r) => (array) $r,
            DB::select("
                SELECT url, sort_order
                FROM recipe_images
                WHERE recipe_id = ?::uuid
                ORDER BY sort_order ASC
            ", [$id])
        );

        $row['images']    = $images;
        $row['image_url'] = $images[0]['url'] ?? null;

        return $row;
    }

    /**
     * Total recipe count (cached).
     */
    private function totalRecipes(): int
    {
        return (int) Cache::remember('total_recipe_count', 3600, function () {
            return DB::selectOne('SELECT COUNT(*)::int AS cnt FROM recipes')->cnt ?? 0;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/recipes/trending
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns the most recently seeded recipes ordered by source_id DESC.
     * The frontend uses this for "What Everyone's Cooking" (limit=4)
     * and the auto-scrolling recipe strip (limit=20).
     *
     * Query params:
     *   limit  (int, 1–50, default 12)
     *   page   (int, default 1)
     */
    public function trending(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => 'integer|min:1|max:50',
            'page'  => 'integer|min:1',
        ]);

        $limit  = (int) $request->input('limit', 12);
        $page   = (int) $request->input('page', 1);
        $offset = ($page - 1) * $limit;

        $cacheKey = "trending_{$limit}_{$page}";

        $results = Cache::remember($cacheKey, 600, function () use ($limit, $offset) {
            $rows = DB::select("
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
                    r.source_id,
                    img.url AS image_url
                FROM recipes r
                LEFT JOIN LATERAL (
                    SELECT url FROM recipe_images
                    WHERE recipe_id = r.id
                    ORDER BY sort_order ASC
                    LIMIT 1
                ) img ON true
                ORDER BY r.source_id DESC
                LIMIT ? OFFSET ?
            ", [$limit, $offset]);

            return array_map(fn($r) => (array) $r, $rows);
        });

        return response()->json([
            'results'    => $results,
            'pagination' => [
                'total'        => $this->totalRecipes(),
                'per_page'     => $limit,
                'current_page' => $page,
                'last_page'    => (int) ceil($this->totalRecipes() / $limit),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/recipes/by-category
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Paginated recipe list filtered by category.
     * Used by /categories/[slug] page.
     *
     * Query params:
     *   category  (string, required)
     *   limit     (int, 1–50, default 12)
     *   page      (int, default 1)
     */
    public function byCategory(Request $request): JsonResponse
    {
        $request->validate([
            'category' => 'required|string|max:100',
            'limit'    => 'integer|min:1|max:50',
            'page'     => 'integer|min:1',
        ]);

        $category = trim($request->input('category'));
        $limit    = (int) $request->input('limit', 12);
        $page     = (int) $request->input('page', 1);
        $offset   = ($page - 1) * $limit;

        $cacheKey = 'by_cat_' . md5("{$category}_{$limit}_{$page}");

        $data = Cache::remember($cacheKey, 600, function () use ($category, $limit, $offset) {
            $rows = DB::select("
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
                    r.source_id,
                    img.url AS image_url
                FROM recipes r
                LEFT JOIN LATERAL (
                    SELECT url FROM recipe_images
                    WHERE recipe_id = r.id
                    ORDER BY sort_order ASC
                    LIMIT 1
                ) img ON true
                WHERE r.category ILIKE ?
                ORDER BY r.source_id DESC
                LIMIT ? OFFSET ?
            ", [$category, $limit, $offset]);

            $total = DB::selectOne(
                'SELECT COUNT(*)::int AS cnt FROM recipes WHERE category ILIKE ?',
                [$category]
            )->cnt ?? 0;

            return [
                'results' => array_map(fn($r) => (array) $r, $rows),
                'total'   => $total,
            ];
        });

        return response()->json([
            'results'    => $data['results'],
            'pagination' => [
                'total'        => $data['total'],
                'per_page'     => $limit,
                'current_page' => $page,
                'last_page'    => max(1, (int) ceil($data['total'] / $limit)),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/recipes/daily-pick
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns a deterministic "recipe of the day".
     * The pick changes every calendar day (UTC) but is the same for
     * all users throughout the day.
     *
     * Algorithm:
     *   offset = day_of_year MOD total_recipe_count
     *   SELECT ... ORDER BY source_id ASC LIMIT 1 OFFSET offset
     *
     * Returns full recipe detail (same shape as /recipes/{id}) plus:
     *   pick_date  — ISO date string "2026-10-15"
     *   chef_note  — generated from recipe description (first sentence)
     */
    public function dailyPick(): JsonResponse
    {
        $today    = now()->format('Y-m-d');
        $cacheKey = "daily_pick_{$today}";

        $recipe = Cache::remember($cacheKey, 3600, function () use ($today) {
            $total  = $this->totalRecipes();
            if ($total === 0) return null;

            $dayOfYear = (int) now()->format('z'); // 0–365
            $offset    = $dayOfYear % $total;

            $row = DB::selectOne("
                SELECT " . $this->detailSelect() . "
                FROM recipes r
                ORDER BY r.source_id ASC
                LIMIT 1 OFFSET ?
            ", [$offset]);

            if (! $row) return null;

            $result = $this->attachDetail((array) $row);

            // Chef note: use description first sentence, trimmed to 160 chars
            $desc = $result['description'] ?? '';
            $firstSentence = preg_split('/(?<=[.!?])\s+/', trim($desc))[0] ?? $desc;
            $result['chef_note'] = mb_substr(trim($firstSentence), 0, 160);
            $result['pick_date'] = $today;

            return $result;
        });

        if (! $recipe) {
            return response()->json(['error' => 'No recipes available.'], 404);
        }

        return response()->json($recipe);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/recipes/weekly-feature
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns a deterministic "recipe of the week".
     * The pick changes every Monday (UTC) but is the same for all users
     * throughout the week.
     *
     * Algorithm:
     *   offset = ISO_week_number MOD total_recipe_count
     *
     * Returns full recipe detail plus:
     *   week_start  — ISO date of this week's Monday
     *   week_end    — ISO date of this week's Sunday
     *   chef_note   — from description
     *   story       — second sentence of description (or same as chef_note)
     *   video_url   — null (no videos yet)
     */
    public function weeklyFeature(): JsonResponse
    {
        $isoWeek  = (int) now()->format('W');
        $isoYear  = (int) now()->format('o');
        $cacheKey = "weekly_feature_{$isoYear}_{$isoWeek}";

        $recipe = Cache::remember($cacheKey, 3600, function () use ($isoWeek) {
            $total = $this->totalRecipes();
            if ($total === 0) return null;

            $offset = $isoWeek % $total;

            // Pick a different recipe from the daily pick by shifting offset by 7
            $offset = ($offset + 7) % $total;

            $row = DB::selectOne("
                SELECT " . $this->detailSelect() . "
                FROM recipes r
                ORDER BY r.source_id ASC
                LIMIT 1 OFFSET ?
            ", [$offset]);

            if (! $row) return null;

            $result = $this->attachDetail((array) $row);

            $desc      = $result['description'] ?? '';
            $sentences = preg_split('/(?<=[.!?])\s+/', trim($desc));
            $result['chef_note'] = mb_substr(trim($sentences[0] ?? $desc), 0, 160);
            $result['story']     = mb_substr(trim($sentences[1] ?? $sentences[0] ?? $desc), 0, 200);
            $result['video_url'] = null;

            // Week boundaries
            $monday = now()->startOfWeek(); // Monday
            $result['week_start'] = $monday->toDateString();
            $result['week_end']   = $monday->copy()->endOfWeek()->toDateString(); // Sunday

            return $result;
        });

        if (! $recipe) {
            return response()->json(['error' => 'No recipes available.'], 404);
        }

        return response()->json($recipe);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/recipes/featured
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns a single "featured dish" — rotates weekly.
     * Picks a different offset from weekly-feature to ensure variety.
     *
     * Returns full recipe detail plus chef_note.
     */
    public function featured(): JsonResponse
    {
        $isoWeek  = (int) now()->format('W');
        $isoYear  = (int) now()->format('o');
        $cacheKey = "featured_{$isoYear}_{$isoWeek}";

        $recipe = Cache::remember($cacheKey, 3600, function () use ($isoWeek) {
            $total = $this->totalRecipes();
            if ($total === 0) return null;

            // Shift by 17 from the weekly-feature pick to guarantee variety
            $offset = ($isoWeek + 17) % $total;

            $row = DB::selectOne("
                SELECT " . $this->detailSelect() . "
                FROM recipes r
                ORDER BY r.source_id ASC
                LIMIT 1 OFFSET ?
            ", [$offset]);

            if (! $row) return null;

            $result = $this->attachDetail((array) $row);

            $desc = $result['description'] ?? '';
            $firstSentence = preg_split('/(?<=[.!?])\s+/', trim($desc))[0] ?? $desc;
            $result['chef_note'] = mb_substr(trim($firstSentence), 0, 160);

            return $result;
        });

        if (! $recipe) {
            return response()->json(['error' => 'No recipes available.'], 404);
        }

        return response()->json($recipe);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/recipes/fresh-picks
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns 6 recipes spread across different categories.
     * Picks the first recipe from each of the top 6 most-populated categories,
     * ordered by source_id DESC within each category.
     *
     * This ensures variety — no two cards are from the same category.
     *
     * Returns array of recipe summaries.
     */
    public function freshPicks(): JsonResponse
    {
        $cacheKey = 'fresh_picks';

        $results = Cache::remember($cacheKey, 3600, function () {
            // Get the 6 categories with the most recipes
            $topCats = DB::select("
                SELECT category
                FROM recipes
                WHERE category IS NOT NULL
                GROUP BY category
                ORDER BY COUNT(*) DESC
                LIMIT 6
            ");

            if (empty($topCats)) return [];

            $picks = [];

            foreach ($topCats as $cat) {
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
                        r.rating,
                        r.review_count,
                        r.calories,
                        r.source_id,
                        img.url AS image_url
                    FROM recipes r
                    LEFT JOIN LATERAL (
                        SELECT url FROM recipe_images
                        WHERE recipe_id = r.id
                        ORDER BY sort_order ASC
                        LIMIT 1
                    ) img ON true
                    WHERE r.category = ?
                    ORDER BY r.source_id DESC
                    LIMIT 1
                ", [$cat->category]);

                if ($row) {
                    $picks[] = (array) $row;
                }
            }

            return $picks;
        });

        return response()->json([
            'results' => $results,
            'count'   => count($results),
        ]);
    }
}
