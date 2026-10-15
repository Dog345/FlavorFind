<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CategoriesController extends Controller
{
    /**
     * GET /api/v1/categories
     *
     * Returns all recipe categories enriched with metadata from recipe_categories table.
     * Falls back gracefully if a category exists in recipes but not in recipe_categories.
     *
     * Response shape:
     * {
     *   "categories": [
     *     {
     *       "name": "Chicken",
     *       "recipe_count": 9,
     *       "description": "...",
     *       "image_url": "https://...supabase.co/storage/...",
     *       "accent_color": "#e3c477",
     *       "sort_order": 1
     *     },
     *     ...
     *   ],
     *   "count": 13
     * }
     */
    public function index(): JsonResponse
    {
        $categories = Cache::remember('v1_categories', 3600, function () {

            // Join recipe counts with category metadata.
            // LEFT JOIN ensures we still return categories that are in recipes
            // even if not yet seeded into recipe_categories.
            $rows = DB::select("
                SELECT
                    r.category                                      AS name,
                    COUNT(*)::int                                   AS recipe_count,
                    rc.description,
                    rc.image_url,
                    COALESCE(rc.accent_color, '#e3c477')            AS accent_color,
                    COALESCE(rc.sort_order, 99)                     AS sort_order
                FROM recipes r
                LEFT JOIN recipe_categories rc ON rc.name = r.category
                WHERE r.category IS NOT NULL
                GROUP BY r.category, rc.description, rc.image_url, rc.accent_color, rc.sort_order
                ORDER BY COALESCE(rc.sort_order, 99) ASC, COUNT(*) DESC
                LIMIT 15
            ");

            return array_map(fn($row) => (array) $row, $rows);
        });

        return response()->json([
            'categories' => $categories,
            'count'      => count($categories),
        ]);
    }
}
