<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop old table if exists
        Schema::dropIfExists('recipes');
        
        // Create fresh recipes table with all columns
        Schema::create('recipes', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->integer('ready_minutes')->default(30);
            $table->integer('prep_minutes')->default(0);
            $table->integer('cook_minutes')->default(30);
            $table->integer('servings')->default(4);
            $table->float('rating')->default(4.0);
            $table->integer('review_count')->default(0);
            $table->json('ingredients')->nullable();
            $table->text('instructions')->nullable();
            $table->json('cuisines')->nullable();
            $table->json('diets')->nullable();
            $table->json('dish_types')->nullable();
            $table->json('nutrition')->nullable();
            $table->string('category')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->string('author')->nullable();
            $table->timestamp('updated_at')->nullable();
            
            // Indexes
            $table->index('rating');
            $table->index('ready_minutes');
            $table->index('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};
