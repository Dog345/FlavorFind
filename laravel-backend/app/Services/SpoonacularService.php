<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

/**
 * SpoonacularService — all Spoonacular API calls go through here.
 *
 * Every method:
 *  1. Asks SpoonacularRouter for an available key.
 *  2. Makes the HTTP request.
 *  3. On 402 (quota exceeded) → marks key exhausted and retries with next key.
 *  4. Records usage on success.
 *  5. Caches responses to reduce API calls.
 */
class SpoonacularService
{
    private SpoonacularRouter $router;
    private string $baseUrl;

    public function __construct(SpoonacularRouter $router)
    {
        $this->router  = $router;
        $this->baseUrl = config('spoonacular.base_url');
    }

    // -------------------------------------------------------------------------
    // Public API Methods
    // -------------------------------------------------------------------------

    /**
     * Search recipes by ingredients.
     * GET /recipes/findByIngredients
     */
    public function findByIngredients(string $ingredients, int $number = 12): array
    {
        $cacheKey = "recipes_ingredients_" . md5($ingredients . $number);

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($ingredients, $number) {
            return $this->request('GET', '/recipes/findByIngredients', [
                'ingredients' => $ingredients,
                'number'      => $number,
                'ranking'     => 1,
                'ignorePantry'=> true,
            ]);
        });
    }

    /**
     * Get full recipe details by ID.
     * GET /recipes/{id}/information
     */
    public function getRecipeById(int $id): array
    {
        $cacheKey = "recipe_detail_{$id}";

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($id) {
            return $this->request('GET', "/recipes/{$id}/information", [
                'includeNutrition' => false,
            ]);
        });
    }

    /**
     * Search recipes with filters (cuisine, diet, type, query).
     * GET /recipes/complexSearch
     */
    public function complexSearch(array $params): array
    {
        $cacheKey = "recipes_search_" . md5(serialize($params));

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($params) {
            return $this->request('GET', '/recipes/complexSearch', array_merge([
                'number'      => 12,
                'addRecipeInformation' => true,
            ], $params));
        });
    }

    /**
     * Get random recipes (optionally filtered by tags).
     * GET /recipes/random
     */
    public function getRandom(int $number = 10, ?string $tags = null): array
    {
        // Random results should not be cached long
        $cacheKey = "recipes_random_" . md5(($tags ?? '') . $number . now()->format('Y-m-d-H'));

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($number, $tags) {
            $params = ['number' => $number];
            if ($tags) {
                $params['tags'] = $tags;
            }
            return $this->request('GET', '/recipes/random', $params);
        });
    }

    /**
     * Autocomplete ingredient search.
     * GET /food/ingredients/autocomplete
     */
    public function autocompleteIngredient(string $query, int $number = 5): array
    {
        $cacheKey = "ingredient_autocomplete_" . md5($query . $number);

        return Cache::remember($cacheKey, now()->addDay(), function () use ($query, $number) {
            return $this->request('GET', '/food/ingredients/autocomplete', [
                'query'  => $query,
                'number' => $number,
            ]);
        });
    }

    // -------------------------------------------------------------------------
    // Core Request Handler with Smart Key Routing + Auto-Retry
    // -------------------------------------------------------------------------

    /**
     * Makes an HTTP request using the smart key router.
     * Retries up to N times if a key is exhausted mid-request (402).
     */
    private function request(string $method, string $endpoint, array $params = []): array
    {
        $maxRetries = count(config('spoonacular.keys'));
        $attempt    = 0;

        while ($attempt < $maxRetries) {
            $keyData  = $this->router->getAvailableKey(); // throws if all exhausted
            $key      = $keyData['key'];
            $usage    = $keyData['usage'];

            $response = Http::timeout(10)->{strtolower($method)}(
                $this->baseUrl . $endpoint,
                array_merge($params, ['apiKey' => $key])
            );

            // 402 = Spoonacular quota exceeded for this key
            if ($response->status() === 402) {
                $this->router->markExhausted($usage);
                $attempt++;
                continue;
            }

            if ($response->failed()) {
                throw new \RuntimeException(
                    "Spoonacular API error: " . $response->status() . " — " . $response->body()
                );
            }

            $this->router->recordUsage($usage);

            // Attach debug headers so Flutter/Next.js can see which key was used
            $remaining = $this->router->getStats()['usage']['remaining'];
            request()->attributes->set('_spoonacular_key_index', $keyData['index']);
            request()->attributes->set('_spoonacular_remaining', $remaining);

            return $response->json();
        }

        throw new \RuntimeException('All Spoonacular API keys are exhausted for today.');
    }
}
