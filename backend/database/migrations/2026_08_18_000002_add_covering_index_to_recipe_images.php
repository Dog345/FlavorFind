<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Composite covering index: (recipe_id, sort_order) + INCLUDE url
        // This lets the LATERAL image lookup satisfy itself entirely from the index
        // without hitting the heap — turns 34K bitmap heap scans into 34K index-only scans.
        DB::statement("
            CREATE INDEX IF NOT EXISTS ri_images_covering_idx
            ON recipe_images (recipe_id, sort_order ASC)
            INCLUDE (url)
        ");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS ri_images_covering_idx');
    }
};
