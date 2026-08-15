<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('recipe_id');
            $table->foreign('recipe_id')->references('id')->on('recipes')->onDelete('cascade');

            $table->uuid('ingredient_id');
            $table->foreign('ingredient_id')->references('id')->on('master_ingredients')->onDelete('cascade');

            // Original quantity string e.g. "1/2", "2", "1 1/4"
            $table->string('quantity')->nullable();

            // Parsed numeric quantity for filtering (e.g. 0.5, 2.0, 1.25)
            $table->decimal('quantity_numeric', 8, 3)->nullable();

            // Unit e.g. "cup", "tbsp", "kg", "piece"
            $table->string('unit')->nullable();

            // Display order within the recipe
            $table->smallInteger('sort_order')->default(0);
        });

        // Fast lookup: all recipes that use a given ingredient
        DB::statement('CREATE INDEX ri_ingredient_idx ON recipe_ingredients (ingredient_id)');

        // Fast lookup: all ingredients in a given recipe
        DB::statement('CREATE INDEX ri_recipe_idx ON recipe_ingredients (recipe_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_ingredients');
    }
};
