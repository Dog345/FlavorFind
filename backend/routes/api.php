<?php

use App\Http\Controllers\RecipeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| FlavorFind API Routes
|--------------------------------------------------------------------------
*/

// Health & Stats
Route::get('/health', [HealthController::class, 'health']);
Route::get('/stats',  [HealthController::class, 'stats']);

// Recipes
Route::prefix('recipes')->group(function () {
    Route::get('/',          [RecipeController::class, 'findByIngredients']); // ?ingredients=chicken,rice
    Route::get('/search',    [RecipeController::class, 'search']);            // ?query=pasta&cuisine=italian
    Route::get('/random',    [RecipeController::class, 'random']);            // ?number=10&tags=vegetarian
    Route::get('/{id}',      [RecipeController::class, 'show']);              // /recipes/123
});

// Ingredients
Route::get('/ingredients/autocomplete', [RecipeController::class, 'autocompleteIngredient']); // ?query=chick

// Categories
Route::prefix('categories')->group(function () {
    Route::get('/',                  [CategoryController::class, 'index']);
    Route::get('/cuisine/{cuisine}', [CategoryController::class, 'byCuisine']);
    Route::get('/diet/{diet}',       [CategoryController::class, 'byDiet']);
    Route::get('/type/{type}',       [CategoryController::class, 'byType']);
});
