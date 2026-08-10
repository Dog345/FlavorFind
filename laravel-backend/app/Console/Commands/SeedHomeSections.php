<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SeedHomeSections extends Command
{
    protected $signature = 'seed:sections';
    protected $description = 'Create home sections from existing recipe data';

    private $supabaseUrl;
    private $supabaseKey;

    public function handle()
    {
        $this->supabaseUrl = env('SUPABASE_URL');
        $this->supabaseKey = env('SUPABASE_SERVICE_KEY');

        if (!$this->supabaseUrl || !$this->supabaseKey) {
            $this->error('❌ Supabase credentials missing');
            return 1;
        }

        $this->info('📊 Analyzing recipes to create sections...');

        // Fetch all recipes
        $recipes = $this->fetchAllRecipes();
        
        if (empty($recipes)) {
            $this->error('❌ No recipes found in database');
            return 1;
        }

        $this->info("✅ Found " . count($recipes) . " recipes");

        // Define 15 sections with smart queries
        $sections = [
            [
                'name' => '🔥 Trending Now',
                'icon' => '🔥',
                'slug' => 'trending-now',
                'type' => 'trending',
                'position' => 1,
                'description' => 'Most popular recipes this week',
                'filter' => fn($r) => $r['rating'] >= 4.5,
                'limit' => 5
            ],
            [
                'name' => '⚡ Quick Bites',
                'icon' => '⚡',
                'slug' => 'quick-bites',
                'type' => 'quick',
                'position' => 2,
                'description' => 'Ready in under 30 minutes',
                'filter' => fn($r) => $r['ready_minutes'] <= 30,
                'limit' => 6
            ],
            [
                'name' => '🌍 World Cuisines',
                'icon' => '🌍',
                'slug' => 'world-cuisines',
                'type' => 'cuisines',
                'position' => 3,
                'description' => 'Explore global flavors',
                'filter' => fn($r) => !empty($r['cuisines']) && $r['cuisines'][0] !== 'American',
                'limit' => 10
            ],
            [
                'name' => '🥗 Healthy Heroes',
                'icon' => '🥗',
                'slug' => 'healthy-heroes',
                'type' => 'healthy',
                'position' => 4,
                'description' => 'Light and nutritious',
                'filter' => fn($r) => in_array('vegan', $r['diets'] ?? []) || in_array('vegetarian', $r['diets'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🍰 Dessert Paradise',
                'icon' => '🍰',
                'slug' => 'dessert-paradise',
                'type' => 'dessert',
                'position' => 5,
                'description' => 'Sweet indulgence',
                'filter' => fn($r) => in_array('dessert', $r['dish_types'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '😌 Comfort Food',
                'icon' => '😌',
                'slug' => 'comfort-food',
                'type' => 'comfort',
                'position' => 6,
                'description' => 'Warm your soul',
                'filter' => fn($r) => in_array('American', $r['cuisines'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '☀️ Breakfast Club',
                'icon' => '☀️',
                'slug' => 'breakfast-club',
                'type' => 'breakfast',
                'position' => 7,
                'description' => 'Start your day right',
                'filter' => fn($r) => in_array('breakfast', $r['dish_types'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🌱 Vegan Vibes',
                'icon' => '🌱',
                'slug' => 'vegan-vibes',
                'type' => 'vegan',
                'position' => 8,
                'description' => '100% plant-based',
                'filter' => fn($r) => in_array('vegan', $r['diets'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🍝 Italian Classics',
                'icon' => '🍝',
                'slug' => 'italian-classics',
                'type' => 'cuisine',
                'position' => 9,
                'description' => 'Pasta, pizza & more',
                'filter' => fn($r) => in_array('Italian', $r['cuisines'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🌮 Mexican Fiesta',
                'icon' => '🌮',
                'slug' => 'mexican-fiesta',
                'type' => 'cuisine',
                'position' => 10,
                'description' => 'Bold and spicy',
                'filter' => fn($r) => in_array('Mexican', $r['cuisines'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🍜 Asian Fusion',
                'icon' => '🍜',
                'slug' => 'asian-fusion',
                'type' => 'cuisine',
                'position' => 11,
                'description' => 'Flavors of the East',
                'filter' => fn($r) => in_array('Asian', $r['cuisines'] ?? []) || 
                                       in_array('Chinese', $r['cuisines'] ?? []) || 
                                       in_array('Japanese', $r['cuisines'] ?? []) ||
                                       in_array('Thai', $r['cuisines'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🥘 Indian Spice',
                'icon' => '🥘',
                'slug' => 'indian-spice',
                'type' => 'cuisine',
                'position' => 12,
                'description' => 'Rich curries & spices',
                'filter' => fn($r) => in_array('Indian', $r['cuisines'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🥙 Mediterranean',
                'icon' => '🥙',
                'slug' => 'mediterranean',
                'type' => 'cuisine',
                'position' => 13,
                'description' => 'Fresh & healthy',
                'filter' => fn($r) => in_array('Mediterranean', $r['cuisines'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🍲 Soup & Stew',
                'icon' => '🍲',
                'slug' => 'soup-stew',
                'type' => 'meal-type',
                'position' => 14,
                'description' => 'Warm and cozy',
                'filter' => fn($r) => in_array('soup', $r['dish_types'] ?? []),
                'limit' => 6
            ],
            [
                'name' => '🥗 Salad Bar',
                'icon' => '🥗',
                'slug' => 'salad-bar',
                'type' => 'meal-type',
                'position' => 15,
                'description' => 'Fresh and crisp',
                'filter' => fn($r) => in_array('salad', $r['dish_types'] ?? []),
                'limit' => 6
            ],
        ];

        $this->info('📝 Creating sections...');
        
        foreach ($sections as $section) {
            // Create section
            $sectionData = [
                'name' => $section['name'],
                'icon' => $section['icon'],
                'slug' => $section['slug'],
                'type' => $section['type'],
                'position' => $section['position'],
                'description' => $section['description'],
            ];

            try {
                $response = Http::withHeaders([
                    'apikey' => $this->supabaseKey,
                    'Authorization' => "Bearer {$this->supabaseKey}",
                    'Content-Type' => 'application/json',
                    'Prefer' => 'return=representation'
                ])->post("{$this->supabaseUrl}/rest/v1/sections", $sectionData);

                if ($response->successful()) {
                    $createdSection = $response->json()[0];
                    $sectionId = $createdSection['id'];
                    
                    // Filter recipes for this section
                    $filteredRecipes = array_filter($recipes, $section['filter']);
                    $selectedRecipes = array_slice($filteredRecipes, 0, $section['limit']);
                    
                    // Link recipes to section
                    $position = 1;
                    foreach ($selectedRecipes as $recipe) {
                        $this->linkRecipeToSection($sectionId, $recipe['id'], $position++);
                    }
                    
                    $this->info("  ✓ {$section['name']} ({count($selectedRecipes)} recipes)");
                } else {
                    $this->warn("  ✗ Failed: {$section['name']}");
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Error: " . $e->getMessage());
            }
        }

        $this->newLine();
        $this->info('✅ Sections created successfully!');
        
        return 0;
    }

    private function fetchAllRecipes()
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
            ])->get("{$this->supabaseUrl}/rest/v1/recipes?select=id,title,rating,ready_minutes,cuisines,diets,dish_types&limit=1000");

            if ($response->successful()) {
                $recipes = $response->json();
                
                // Parse JSON arrays from Supabase (they come as strings with {} format)
                foreach ($recipes as &$recipe) {
                    // Convert PostgreSQL array format {item1,item2} to PHP array
                    $recipe['cuisines'] = $this->parsePostgresArray($recipe['cuisines'] ?? '');
                    $recipe['diets'] = $this->parsePostgresArray($recipe['diets'] ?? '');
                    $recipe['dish_types'] = $this->parsePostgresArray($recipe['dish_types'] ?? '');
                }
                
                return $recipes;
            }
            
            return [];
        } catch (\Exception $e) {
            $this->error('Error fetching recipes: ' . $e->getMessage());
            return [];
        }
    }

    private function parsePostgresArray($value)
    {
        if (is_array($value)) {
            return $value;
        }
        
        if (empty($value) || $value === '{}') {
            return [];
        }
        
        // PostgreSQL returns arrays as {item1,item2,item3}
        $value = trim($value, '{}');
        if (empty($value)) {
            return [];
        }
        
        return array_map('trim', explode(',', $value));
    }

    private function linkRecipeToSection($sectionId, $recipeId, $position)
    {
        try {
            Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
                'Content-Type' => 'application/json',
            ])->post("{$this->supabaseUrl}/rest/v1/section_recipes", [
                'section_id' => $sectionId,
                'recipe_id' => $recipeId,
                'position' => $position,
            ]);
        } catch (\Exception $e) {
            // Skip duplicates
        }
    }
}
