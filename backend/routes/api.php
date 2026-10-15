<?php

use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\RecipeDiscoveryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| FlavorFind Standalone API — v1
|--------------------------------------------------------------------------
|
| All routes are public (no auth required for the standalone consumer product).
|
| Base URL: /api/v1/
|
| Categories:
|   GET /api/v1/categories                    — all categories with metadata + counts
|
| Ingredients:
|   GET /api/v1/ingredients/search            — autocomplete by name
|   GET /api/v1/ingredients/suggest-multi     — suggestions for N ingredients
|   GET /api/v1/ingredients/{id}              — single ingredient detail
|   GET /api/v1/ingredients/{id}/suggestions  — suggestions for one ingredient
|
| Recipes — discovery (no ingredient search required):
|   GET /api/v1/recipes/trending              — most recently seeded, paginated
|   GET /api/v1/recipes/by-category           — paginated list filtered by category
|   GET /api/v1/recipes/daily-pick            — deterministic pick of the day
|   GET /api/v1/recipes/weekly-feature        — deterministic pick of the week
|   GET /api/v1/recipes/featured              — featured dish, rotates weekly
|   GET /api/v1/recipes/fresh-picks           — 6 recipes spread across categories
|
| Recipes — search:
|   GET /api/v1/recipes/search               — search recipes by ingredient ids
|   GET /api/v1/recipes/categories           — list all categories with counts (legacy)
|   GET /api/v1/recipes/{id}                 — full recipe detail
|
*/

Route::prefix('v1')->group(function () {

    // ── Categories ────────────────────────────────────────────────────────────
    Route::get('categories', [CategoriesController::class, 'index']);

    // ── Ingredients ──────────────────────────────────────────────────────────
    Route::prefix('ingredients')->group(function () {
        // Static routes before {id} wildcard
        Route::get('search',           [IngredientController::class, 'search']);
        Route::get('suggest-multi',    [IngredientController::class, 'suggestMulti']);
        Route::get('{id}',             [IngredientController::class, 'show']);
        Route::get('{id}/suggestions', [IngredientController::class, 'suggestions']);
    });

    // ── Recipes ───────────────────────────────────────────────────────────────
    Route::prefix('recipes')->group(function () {

        // ── Discovery endpoints — MUST come before {id} wildcard ──────────────
        Route::get('trending',       [RecipeDiscoveryController::class, 'trending']);
        Route::get('by-category',    [RecipeDiscoveryController::class, 'byCategory']);
        Route::get('daily-pick',     [RecipeDiscoveryController::class, 'dailyPick']);
        Route::get('weekly-feature', [RecipeDiscoveryController::class, 'weeklyFeature']);
        Route::get('featured',       [RecipeDiscoveryController::class, 'featured']);
        Route::get('fresh-picks',    [RecipeDiscoveryController::class, 'freshPicks']);

        // ── Search & legacy category list ─────────────────────────────────────
        Route::get('search',     [RecipeController::class, 'search']);
        Route::get('categories', [RecipeController::class, 'categories']);

        // ── Single recipe detail — wildcard LAST ──────────────────────────────
        Route::get('{id}', [RecipeController::class, 'show']);
    });

});
