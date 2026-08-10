<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class IngredientController extends Controller
{
    private $supabaseUrl;
    private $supabaseKey;

    public function __construct()
    {
        $this->supabaseUrl = env('SUPABASE_URL');
        $this->supabaseKey = env('SUPABASE_SERVICE_KEY');
    }

    /**
     * Get all ingredient categories with their ingredients
     * GET /api/ingredient-categories
     */
    public function index()
    {
        try {
            // Fetch all categories
            $categoriesResponse = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
            ])->get("{$this->supabaseUrl}/rest/v1/ingredient_categories?order=position.asc");

            if (!$categoriesResponse->successful()) {
                return response()->json(['error' => 'Failed to fetch categories'], 500);
            }

            $categories = $categoriesResponse->json();
            $result = [];

            // For each category, fetch its ingredients
            foreach ($categories as $category) {
                $ingredientsResponse = Http::withHeaders([
                    'apikey' => $this->supabaseKey,
                    'Authorization' => "Bearer {$this->supabaseKey}",
                ])->get("{$this->supabaseUrl}/rest/v1/ingredients?category_id=eq.{$category['id']}&order=name.asc");

                $ingredients = [];
                if ($ingredientsResponse->successful()) {
                    $fetchedIngredients = $ingredientsResponse->json();
                    
                    $ingredients = array_map(function($ing) {
                        return [
                            'id' => $ing['id'],
                            'name' => $ing['name'],
                            'emoji' => $ing['emoji'],
                            'color' => $ing['color'],
                        ];
                    }, $fetchedIngredients);
                }

                $result[] = [
                    'id' => $category['id'],
                    'name' => $category['name'],
                    'icon' => $category['icon'],
                    'slug' => $category['slug'],
                    'gradientStart' => $category['gradient_start'],
                    'gradientEnd' => $category['gradient_end'],
                    'ingredients' => $ingredients,
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
}
