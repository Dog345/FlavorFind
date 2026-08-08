<?php

namespace App\Http\Controllers;

use App\Services\SpoonacularService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function __construct(private SpoonacularService $spoonacular) {}

    /**
     * GET /api/recipes?ingredients=chicken,rice&number=12
     */
    public function findByIngredients(Request $request): JsonResponse
    {
        $request->validate([
            'ingredients' => 'required|string|max:500',
            'number'      => 'sometimes|integer|min:1|max:50',
        ]);

        $data = $this->spoonacular->findByIngredients(
            $request->input('ingredients'),
            $request->integer('number', 12)
        );

        return response()->json($data);
    }

    /**
     * GET /api/recipes/{id}
     */
    public function show(int $id): JsonResponse
    {
        $data = $this->spoonacular->getRecipeById($id);
        return response()->json($data);
    }

    /**
     * GET /api/recipes/search?query=pasta&cuisine=italian&diet=vegetarian&type=main+course&number=12
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query'   => 'sometimes|string|max:200',
            'cuisine' => 'sometimes|string',
            'diet'    => 'sometimes|string',
            'type'    => 'sometimes|string',
            'number'  => 'sometimes|integer|min:1|max:50',
        ]);

        $data = $this->spoonacular->complexSearch($request->only([
            'query', 'cuisine', 'diet', 'type', 'number',
        ]));

        return response()->json($data);
    }

    /**
     * GET /api/recipes/random?number=10&tags=vegetarian
     */
    public function random(Request $request): JsonResponse
    {
        $request->validate([
            'number' => 'sometimes|integer|min:1|max:20',
            'tags'   => 'sometimes|string',
        ]);

        $data = $this->spoonacular->getRandom(
            $request->integer('number', 10),
            $request->input('tags')
        );

        return response()->json($data);
    }

    /**
     * GET /api/ingredients/autocomplete?query=chick
     */
    public function autocompleteIngredient(Request $request): JsonResponse
    {
        $request->validate(['query' => 'required|string|min:2|max:100']);

        $data = $this->spoonacular->autocompleteIngredient(
            $request->input('query'),
            $request->integer('number', 5)
        );

        return response()->json($data);
    }
}
