<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_categories', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->smallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('category_id')->nullable();
            $table->foreign('category_id')->references('id')->on('menu_categories')->onDelete('set null');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->string('image_url')->nullable();
            $table->boolean('is_available')->default(true);
            $table->smallInteger('preparation_time_mins')->default(15);
            $table->smallInteger('sort_order')->default(0);
            // Optional link to FlavorFind recipe DB (UUID from the flavorfind.recipes table)
            $table->uuid('flavorfind_recipe_id')->nullable();
            $table->timestamps();
        });

        // allergen_flags stored as Postgres text array
        DB::statement('ALTER TABLE menu_items ADD COLUMN allergen_flags TEXT[] DEFAULT ARRAY[]::TEXT[]');

        DB::statement("CREATE INDEX mc_tenant_sort_idx ON menu_categories (tenant_id, sort_order)");
        DB::statement("CREATE INDEX mi_tenant_category_idx ON menu_items (tenant_id, category_id)");
        DB::statement("CREATE INDEX mi_tenant_available_idx ON menu_items (tenant_id, is_available)");
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('menu_categories');
    }
};
