<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class RecipeController extends Controller
{
    private $supabaseUrl;
    private $supabaseKey;

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url') ?? env('SUPABASE_URL');
        $this->supabaseKey = config('services.supabase.key') ?? env('SUPABASE_SERVICE_KEY');
    }

    /**
     * Search recipes by ingredients
     * POST /api/recipes/search-by-ingredients
     * Body: { "ingredients": ["chicken", "garlic", "onion"] }
     */
    public function searchByIngredients(Request $request)
    {
        $request->validate([
            'ingredients' => 'required|array|min:1',
            'ingredients.*' => 'string',
        ]);

        try {
            $searchIngredients = array_map('strtolower', $request->ingredients);
            
            // Fetch all recipes with ingredients
            $response = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
            ])->get("{$this->supabaseUrl}/rest/v1/recipes?select=*");

            if (!$response->successful()) {
                return response()->json(['error' => 'Failed to fetch recipes'], 500);
            }

            $allRecipes = $response->json();
            $matches = [];

            // Filter recipes that contain the searched ingredients
            foreach ($allRecipes as $recipe) {
                $ingredientsData = json_decode($recipe['ingredients'], true);
                
                if (!isset($ingredientsData['list']) || !is_array($ingredientsData['list'])) {
                    continue;
                }

                $recipeIngredients = array_map('strtolower', $ingredientsData['list']);
                $matchCount = 0;

                // Count how many search ingredients are in this recipe
                foreach ($searchIngredients as $searchIng) {
                    foreach ($recipeIngredients as $recipeIng) {
                        if (stripos($recipeIng, $searchIng) !== false) {
                            $matchCount++;
                            break;
                        }
                    }
                }

                // Include recipes that match at least one ingredient
                if ($matchCount > 0) {
                    $matches[] = [
                        'recipe' => $recipe,
                        'matchCount' => $matchCount,
                        'matchPercentage' => ($matchCount / count($searchIngredients)) * 100,
                    ];
                }
            }

            // Sort by match count (most matches first)
            usort($matches, function($a, $b) {
                return $b['matchCount'] - $a['matchCount'];
            });

            // Format results
            $results = array_map(function($match) {
                $recipe = $match['recipe'];
                return [
                    'id' => $recipe['id'],
                    'title' => $recipe['title'],
                    'image' => $recipe['image_url'],
                    'readyInMinutes' => $recipe['ready_minutes'] ?? 30,
                    'servings' => $recipe['servings'] ?? 4,
                    'rating' => $recipe['rating'] ?? 4.5,
                    'cuisines' => $this->parseArray($recipe['cuisines'] ?? '{}'),
                    'diets' => $this->parseArray($recipe['diets'] ?? '{}'),
                    'matchCount' => $match['matchCount'],
                    'matchPercentage' => round($match['matchPercentage'], 1),
                ];
            }, $matches);

            return response()->json([
                'success' => true,
                'data' => $results,
                'total' => count($results),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get recipe details by ID
     * GET /api/recipes/{id}
     */
    public function show($id)
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
            ])->get("{$this->supabaseUrl}/rest/v1/recipes?id=eq.{$id}");

            if (!$response->successful()) {
                return response()->json(['error' => 'Recipe not found'], 404);
            }

            $recipes = $response->json();
            if (empty($recipes)) {
                return response()->json(['error' => 'Recipe not found'], 404);
            }

            $recipe = $recipes[0];

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $recipe['id'],
                    'title' => $recipe['title'],
                    'description' => $recipe['description'],
                    'image' => $recipe['image_url'],
                    'readyInMinutes' => $recipe['ready_minutes'] ?? 30,
                    'servings' => $recipe['servings'] ?? 4,
                    'ingredients' => json_decode($recipe['ingredients'], true),
                    'instructions' => $recipe['instructions'],
                    'cuisines' => $this->parseArray($recipe['cuisines'] ?? '{}'),
                    'diets' => $this->parseArray($recipe['diets'] ?? '{}'),
                    'dishTypes' => $this->parseArray($recipe['dish_types'] ?? '{}'),
                    'nutrition' => json_decode($recipe['nutrition'] ?? '{}', true),
                    'rating' => $recipe['rating'] ?? 4.5,
                ],
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
