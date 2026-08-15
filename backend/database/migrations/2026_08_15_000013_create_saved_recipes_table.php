<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_recipes', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->uuid('recipe_id');
            $table->string('collection')->default('favourites'); // future: custom collections
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')->on('flavorfind_users')
                  ->onDelete('cascade');

            $table->foreign('recipe_id')
                  ->references('id')->on('recipes')
                  ->onDelete('cascade');

            // A user can only save the same recipe once per collection
            $table->unique(['user_id', 'recipe_id', 'collection']);
        });

        // Fast lookup: given user_id, list all saved recipes ordered by newest
        DB::statement('CREATE INDEX sr_user_created_idx ON saved_recipes (user_id, created_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_recipes');
    }
};
