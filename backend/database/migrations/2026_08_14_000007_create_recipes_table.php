<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // Core identity
            $table->integer('source_id')->unique();          // original RecipeId from Food.com
            $table->string('name');
            $table->string('category')->nullable();
            $table->text('description')->nullable();

            // Timing & servings
            $table->string('cook_time')->nullable();          // ISO 8601 e.g. PT25M
            $table->string('prep_time')->nullable();
            $table->string('total_time')->nullable();
            $table->integer('servings')->nullable();
            $table->string('yield')->nullable();

            // Instructions stored as JSONB array of steps
            $table->jsonb('instructions')->default('[]');

            // Keywords stored as JSONB array
            $table->jsonb('keywords')->default('[]');

            // Nutrition (per serving)
            $table->decimal('calories', 8, 2)->nullable();
            $table->decimal('protein_g', 8, 2)->nullable();
            $table->decimal('fat_g', 8, 2)->nullable();
            $table->decimal('carbs_g', 8, 2)->nullable();
            $table->decimal('fiber_g', 8, 2)->nullable();
            $table->decimal('sugar_g', 8, 2)->nullable();
            $table->decimal('cholesterol_mg', 8, 2)->nullable();
            $table->decimal('sodium_mg', 8, 2)->nullable();
            $table->decimal('saturated_fat_g', 8, 2)->nullable();

            // Community data
            $table->decimal('rating', 3, 2)->nullable();      // 0.00 – 5.00
            $table->integer('review_count')->default(0);

            $table->timestamps();
        });

        // Indexes for common query patterns
        DB::statement('CREATE INDEX recipes_category_idx ON recipes (category)');
        DB::statement('CREATE INDEX recipes_rating_idx ON recipes (rating DESC NULLS LAST)');
        DB::statement('CREATE INDEX recipes_calories_idx ON recipes (calories)');

        // Full-text search on name + description
        DB::statement("
            CREATE INDEX recipes_fts_idx ON recipes
            USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};
