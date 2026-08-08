<?php

namespace App\Http\Controllers;

use App\Services\SpoonacularService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // These are the categories/cuisines/diets supported by Spoonacular
    private const CUISINES = [
        'African','Asian','American','British','Cajun','Caribbean','Chinese',
        'Eastern European','European','French','German','Greek','Indian',
        'Irish','Italian','Japanese','Jewish','Korean','Latin American',
        'Mediterranean','Mexican','Middle Eastern','Nordic','Southern',
        'Spanish','Thai','Vietnamese',
    ];

    private const DIETS = [
        'Gluten Free','Ketogenic','Vegetarian','Lacto-Vegetarian',
        'Ovo-Vegetarian','Vegan','Pescetarian','Paleo','Primal','Whole30',
    ];

    private const MEAL_TYPES = [
        'main course','side dish','dessert','appetizer','salad',
        'bread','breakfast','soup','beverage','sauce','marinade',
        'fingerfood','snack','drink',
    ];

    public function __construct(private SpoonacularService $spoonacular) {}

    /**
     * GET /api/categories — returns all available filter options
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'cuisines'   => self::CUISINES,
            'diets'      => self::DIETS,
            'meal_types' => self::MEAL_TYPES,
        ]);
    }

    /**
     * GET /api/categories/cuisine/{cuisine}?number=12
     */
    public function byCuisine(Request $request, string $cuisine): JsonResponse
    {
        $data = $this->spoonacular->complexSearch([
            'cuisine' => $cuisine,
            'number'  => $request->integer('number', 12),
        ]);

        return response()->json($data);
    }

    /**
     * GET /api/categories/diet/{diet}?number=12
     */
    public function byDiet(Request $request, string $diet): JsonResponse
    {
        $data = $this->spoonacular->complexSearch([
            'diet'   => $diet,
            'number' => $request->integer('number', 12),
        ]);

        return response()->json($data);
    }

    /**
     * GET /api/categories/type/{type}?number=12
     */
    public function byType(Request $request, string $type): JsonResponse
    {
        $data = $this->spoonacular->complexSearch([
            'type'   => $type,
            'number' => $request->integer('number', 12),
        ]);

        return response()->json($data);
    }
}
