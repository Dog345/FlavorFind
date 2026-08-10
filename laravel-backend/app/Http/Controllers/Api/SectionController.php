<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SectionController extends Controller
{
    private $supabaseUrl;
    private $supabaseKey;

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url') ?? env('SUPABASE_URL');
        $this->supabaseKey = config('services.supabase.key') ?? env('SUPABASE_SERVICE_KEY');
    }

    /**
     * Get all home sections with their recipes
     * GET /api/sections
     */
    public function index()
    {
        try {
            // Fetch all sections
            $sectionsResponse = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
            ])->get("{$this->supabaseUrl}/rest/v1/sections?order=position.asc");

            if (!$sectionsResponse->successful()) {
                return response()->json(['error' => 'Failed to fetch sections'], 500);
            }

            $sections = $sectionsResponse->json();
            $result = [];

            // For each section, fetch its recipes
            foreach ($sections as $section) {
                // Fetch section_recipes join table
                $sectionRecipesResponse = Http::withHeaders([
                    'apikey' => $this->supabaseKey,
                    'Authorization' => "Bearer {$this->supabaseKey}",
                ])->get("{$this->supabaseUrl}/rest/v1/section_recipes?section_id=eq.{$section['id']}&order=position.asc");

                $sectionRecipes = $sectionRecipesResponse->successful() ? $sectionRecipesResponse->json() : [];
                $recipeIds = array_column($sectionRecipes, 'recipe_id');

                $recipes = [];
                if (!empty($recipeIds)) {
                    // Fetch recipes by IDs
                    $recipeIdsStr = implode(',', $recipeIds);
                    $recipesResponse = Http::withHeaders([
                        'apikey' => $this->supabaseKey,
                        'Authorization' => "Bearer {$this->supabaseKey}",
                    ])->get("{$this->supabaseUrl}/rest/v1/recipes?id=in.({$recipeIdsStr})");

                    if ($recipesResponse->successful()) {
                        $fetchedRecipes = $recipesResponse->json();
                        
                        // Format recipes for app consumption
                        $recipes = array_map(function($recipe) {
                            return [
                                'id' => $recipe['id'],
                                'title' => $recipe['title'],
                                'image' => $recipe['image_url'],
                                'readyInMinutes' => $recipe['ready_minutes'] ?? 30,
                                'servings' => $recipe['servings'] ?? 4,
                                'rating' => $recipe['rating'] ?? 4.5,
                                'cuisines' => $this->parseArray($recipe['cuisines'] ?? '{}'),
                                'diets' => $this->parseArray($recipe['diets'] ?? '{}'),
                            ];
                        }, $fetchedRecipes);
                    }
                }

                $result[] = [
                    'id' => $section['id'],
                    'title' => $section['name'],
                    'icon' => $section['icon'],
                    'slug' => $section['slug'],
                    'recipes' => $recipes,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Parse PostgreSQL array format {item1,item2} to PHP array
     */
    private function parseArray($pgArray)
    {
        if (is_array($pgArray)) {
            return $pgArray;
        }
        
        if (empty($pgArray) || $pgArray === '{}') {
            return [];
        }

        $cleaned = trim($pgArray, '{}');
        if (empty($cleaned)) {
            return [];
        }

        return array_map('trim', explode(',', $cleaned));
    }
}
