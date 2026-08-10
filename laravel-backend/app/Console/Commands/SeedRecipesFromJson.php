<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class SeedRecipesFromJson extends Command
{
    protected $signature = 'seed:recipes {--file=/home/m/Documents/GitHub/FlavorFind/filtered_recipes.json}';
    protected $description = 'Seed recipes from filtered JSON to Supabase database';

    private $supabaseUrl;
    private $supabaseKey;

    public function handle()
    {
        // Get Supabase credentials from .env
        $this->supabaseUrl = env('SUPABASE_URL');
        $this->supabaseKey = env('SUPABASE_SERVICE_KEY'); // Use service_role key for write access
        
        if (!$this->supabaseUrl || !$this->supabaseKey) {
            $this->error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
            return 1;
        }

        $filePath = $this->option('file');
        
        if (!file_exists($filePath)) {
            $this->error("❌ File not found: {$filePath}");
            return 1;
        }

        $this->info("📂 Reading recipes from: {$filePath}");
        
        $recipes = json_decode(file_get_contents($filePath), true);
        
        if (!$recipes) {
            $this->error('❌ Failed to parse JSON file');
            return 1;
        }

        $this->info("✅ Loaded " . count($recipes) . " recipes");
        
        // Seed in batches
        $batchSize = 50;
        $totalBatches = ceil(count($recipes) / $batchSize);
        $successCount = 0;
        $errorCount = 0;

        $bar = $this->output->createProgressBar($totalBatches);
        $bar->start();

        foreach (array_chunk($recipes, $batchSize) as $batchIndex => $batch) {
            $supabaseRecipes = [];
            
            foreach ($batch as $recipe) {
                // Format for Supabase
                $supabaseRecipes[] = [
                    'title' => $recipe['title'],
                    'description' => implode(' ', array_slice($recipe['directions'], 0, 2)), // First 2 steps as description
                    'image_url' => $this->generatePlaceholderImage($recipe['title']),
                    'ready_minutes' => $recipe['ready_minutes'] ?? 30,
                    'servings' => $recipe['servings'] ?? 4,
                    'rating' => $recipe['rating'] ?? 4.0,
                    'cuisines' => $recipe['cuisines'] ?? [],
                    'diets' => $recipe['diets'] ?? [],
                    'dish_types' => $recipe['dish_types'] ?? [],
                    'ingredients' => json_encode([
                        'list' => $recipe['ingredients'],
                        'ner' => $recipe['ner'] ?? []
                    ]),
                    'instructions' => implode("\n\n", $recipe['directions']),
                    'source_url' => $recipe['source_url'] ?? null,
                ];
            }

            // Insert batch to Supabase via REST API
            try {
                $response = Http::withHeaders([
                    'apikey' => $this->supabaseKey,
                    'Authorization' => "Bearer {$this->supabaseKey}",
                    'Content-Type' => 'application/json',
                    'Prefer' => 'return=minimal'
                ])->post("{$this->supabaseUrl}/rest/v1/recipes", $supabaseRecipes);

                if ($response->successful()) {
                    $successCount += count($supabaseRecipes);
                } else {
                    $errorCount += count($supabaseRecipes);
                    $this->newLine();
                    $this->error("❌ Batch {$batchIndex} failed: " . $response->body());
                }
            } catch (\Exception $e) {
                $errorCount += count($supabaseRecipes);
                $this->newLine();
                $this->error("❌ Exception in batch {$batchIndex}: " . $e->getMessage());
            }

            $bar->advance();
            usleep(200000); // 200ms delay between batches to avoid rate limits
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Seeding complete!");
        $this->info("   Success: {$successCount} recipes");
        if ($errorCount > 0) {
            $this->warn("   Errors: {$errorCount} recipes");
        }

        return 0;
    }

    private function generatePlaceholderImage($title)
    {
        // Use Unsplash API for food images based on title keywords
        $keywords = ['food', 'recipe', 'dish', 'meal'];
        
        // Extract first word from title for better matching
        $words = explode(' ', strtolower($title));
        $searchTerm = $words[0] ?? 'food';
        
        // If it's a known food category, use it
        $foodCategories = ['pizza', 'pasta', 'burger', 'salad', 'soup', 'cake', 'chicken', 'fish', 'beef'];
        foreach ($foodCategories as $category) {
            if (stripos($title, $category) !== false) {
                $searchTerm = $category;
                break;
            }
        }
        
        return "https://source.unsplash.com/400x300/?{$searchTerm},food";
    }
}
