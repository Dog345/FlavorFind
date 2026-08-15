<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_pairings', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // The "anchor" ingredient — e.g. chicken
            $table->uuid('ingredient_id');
            $table->foreign('ingredient_id')
                  ->references('id')->on('master_ingredients')
                  ->onDelete('cascade');

            // The ingredient that pairs well with it — e.g. garlic
            $table->uuid('paired_ingredient_id');
            $table->foreign('paired_ingredient_id')
                  ->references('id')->on('master_ingredients')
                  ->onDelete('cascade');

            // How many recipes contain BOTH ingredients together
            $table->integer('co_occurrence_count')->default(0);

            // Normalised score 0.0–1.0
            // score = co_occurrence / total_recipes_with_anchor
            // 1.0 = paired ingredient appears in EVERY recipe that has anchor
            $table->decimal('score', 6, 5)->default(0);

            // Pairing category — helps the UI show "add a sauce", "add a side", etc.
            $table->string('paired_category')->nullable();

            $table->timestamps();

            // Each pair is unique
            $table->unique(['ingredient_id', 'paired_ingredient_id']);
        });

        // Fast lookup: given an ingredient_id, get top pairings ordered by score
        DB::statement('CREATE INDEX ip_ingredient_score_idx ON ingredient_pairings (ingredient_id, score DESC)');

        // Fast lookup: given paired_ingredient_id (reverse lookup)
        DB::statement('CREATE INDEX ip_paired_idx ON ingredient_pairings (paired_ingredient_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_pairings');
    }
};
