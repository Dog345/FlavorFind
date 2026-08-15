<?php

use App\Http\Controllers\IngredientController;
use App\Http\Controllers\RecipeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| FlavorFind Standalone API — v1
|--------------------------------------------------------------------------
|
| All routes are public (no auth required for the standalone consumer product).
| Auth will be added later via Google OAuth if/when users request it.
|
| Base URL: /api/v1/
|
| Ingredients:
|   GET /api/v1/ingredients/search              — autocomplete by name
|   GET /api/v1/ingredients/suggest-multi       — suggestions for N ingredients
|   GET /api/v1/ingredients/{id}                — single ingredient detail
|   GET /api/v1/ingredients/{id}/suggestions    — suggestions for one ingredient
|
| Recipes:
|   GET /api/v1/recipes/search                  — search recipes by ingredient ids
|   GET /api/v1/recipes/categories              — list all categories with counts
|   GET /api/v1/recipes/{id}                    — full recipe detail
|
*/

Route::prefix('v1')->group(function () {

    // ── Ingredients ──────────────────────────────────────────────────────────
    Route::prefix('ingredients')->group(function () {
        // Note: 'search' and 'suggest-multi' are before {id} to avoid being
        // swallowed by the wildcard route.
        Route::get('search',        [IngredientController::class, 'search']);
        Route::get('suggest-multi', [IngredientController::class, 'suggestMulti']);
        Route::get('{id}',          [IngredientController::class, 'show']);
        Route::get('{id}/suggestions', [IngredientController::class, 'suggestions']);
    });

    // ── Recipes ───────────────────────────────────────────────────────────────
    Route::prefix('recipes')->group(function () {
        Route::get('search',     [RecipeController::class, 'search']);
        Route::get('categories', [RecipeController::class, 'categories']);
        Route::get('{id}',       [RecipeController::class, 'show']);
    });

});
