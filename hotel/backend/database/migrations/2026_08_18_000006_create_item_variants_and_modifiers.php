<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_variants', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('menu_item_id');
            $table->foreign('menu_item_id')->references('id')->on('menu_items')->onDelete('cascade');
            $table->string('name');                              // Small, Medium, Large
            $table->decimal('price_adjustment', 8, 2)->default(0); // + or - from base_price
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->smallInteger('sort_order')->default(0);
        });

        Schema::create('item_modifiers', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('menu_item_id');
            $table->foreign('menu_item_id')->references('id')->on('menu_items')->onDelete('cascade');
            $table->string('name');                              // Extra Cheese, No Onions
            $table->decimal('price_adjustment', 8, 2)->default(0);
            $table->boolean('is_available')->default(true);
            $table->smallInteger('sort_order')->default(0);
        });

        DB::statement("CREATE INDEX iv_item_idx ON item_variants (menu_item_id)");
        DB::statement("CREATE INDEX im_item_idx ON item_modifiers (menu_item_id)");
    }

    public function down(): void
    {
        Schema::dropIfExists('item_modifiers');
        Schema::dropIfExists('item_variants');
    }
};
