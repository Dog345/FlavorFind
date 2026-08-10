<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class SpoonacularRecipeSeeder extends Seeder
{
    /**
     * Seed recipes from JSONL file to Supabase
     */
    public function run(): void
    {
        $jsonlFile = '/tmp/recipes_seed.jsonl';
        
        if (!file_exists($jsonlFile)) {
            $this->command->error("File not found: {$jsonlFile}");
            return;
        }
        
        $supabaseUrl = config('services.supabase.url') ?? env('SUPABASE_URL');
        $supabaseKey = config('services.supabase.key') ?? env('SUPABASE_SERVICE_KEY');
        
        if (!$supabaseUrl || !$supabaseKey) {
            $this->command->error("Supabase credentials not configured");
            return;
        }
        
        $this->command->info("Starting Spoonacular recipe seeding...");
        
        // Step 1: Clear existing recipes
        $this->command->line("Clearing existing recipes...");
        try {
            Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => 'application/json',
            ])->delete("{$supabaseUrl}/rest/v1/recipes?select=id&id=gt.0");
            
            $this->command->line("✓ Cleared existing recipes");
        } catch (\Exception $e) {
            $this->command->warn("Could not clear existing recipes: {$e->getMessage()}");
        }
        
        // Step 2: Stream load recipes
        $this->command->line("Loading recipes from JSONL...");
        $handle = fopen($jsonlFile, 'r');
        $batch = [];
        $batchSize = 100;
        $totalCount = 0;
        
        while (($line = fgets($handle)) !== false) {
            $recipe = json_decode(trim($line), true);
            
            if (!$recipe) {
                continue;
            }
            
            $batch[] = $recipe;
            
            if (count($batch) >= $batchSize) {
                $this->insertBatch($batch, $supabaseUrl, $supabaseKey);
                $totalCount += count($batch);
                $this->command->line("Inserted {$totalCount} recipes...");
                $batch = [];
            }
        }
        
        // Insert remaining batch
        if (count($batch) > 0) {
            $this->insertBatch($batch, $supabaseUrl, $supabaseKey);
            $totalCount += count($batch);
        }
        
        fclose($handle);
        
        $this->command->info("✓ Seeding complete! Inserted {$totalCount} recipes");
    }
    
    /**
     * Insert a batch of recipes via Supabase REST API
     */
    private function insertBatch(array $batch, string $supabaseUrl, string $supabaseKey): void
    {
        try {
            Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => 'application/json',
                'Prefer' => 'return=minimal',
            ])->post("{$supabaseUrl}/rest/v1/recipes", $batch);
        } catch (\Exception $e) {
            $this->command->warn("Batch insert failed: {$e->getMessage()}");
        }
    }
}
