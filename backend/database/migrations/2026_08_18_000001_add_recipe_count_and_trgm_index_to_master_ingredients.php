<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Enable pg_trgm extension (needed for fast ILIKE / fuzzy search)
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        // Add recipe_count column — denormalised count of recipes using this ingredient.
        // Replaces the expensive COUNT(ri.recipe_id) JOIN on every autocomplete query.
        DB::statement('ALTER TABLE master_ingredients ADD COLUMN IF NOT EXISTS recipe_count INTEGER NOT NULL DEFAULT 0');

        // Backfill from recipe_ingredients (runs once, ~1–2s on 4M rows)
        DB::statement("
            UPDATE master_ingredients mi
            SET recipe_count = sub.cnt
            FROM (
                SELECT ingredient_id, COUNT(*)::int AS cnt
                FROM recipe_ingredients
                GROUP BY ingredient_id
            ) sub
            WHERE mi.id = sub.ingredient_id
        ");

        // Trigram index on name — makes ILIKE '%tomato%' use an index instead of seq scan
        DB::statement("CREATE INDEX IF NOT EXISTS mi_name_trgm_idx ON master_ingredients USING gin (name gin_trgm_ops)");

        // Also a btree prefix index for exact/prefix matches (LIKE 'tomato%')
        DB::statement("CREATE INDEX IF NOT EXISTS mi_name_btree_idx ON master_ingredients (lower(name) text_pattern_ops)");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS mi_name_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS mi_name_btree_idx');
        DB::statement('ALTER TABLE master_ingredients DROP COLUMN IF EXISTS recipe_count');
    }
};
