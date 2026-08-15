<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipe_images', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('recipe_id');
            $table->foreign('recipe_id')->references('id')->on('recipes')->onDelete('cascade');

            $table->text('url');
            $table->smallInteger('sort_order')->default(0);   // 0 = primary image
        });

        DB::statement('CREATE INDEX ri_images_recipe_idx ON recipe_images (recipe_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_images');
    }
};
