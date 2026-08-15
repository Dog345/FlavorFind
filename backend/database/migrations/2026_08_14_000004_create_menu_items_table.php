<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->string('category')->nullable();          // "starters", "mains", "drinks", "desserts"
            $table->string('image_url')->nullable();
            $table->boolean('is_available')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Add Postgres-native TEXT[] column
        DB::statement('ALTER TABLE menu_items ADD COLUMN allergen_flags TEXT[] NULL;');

        // Enable Row-Level Security
        DB::statement('ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;');

        // RLS Policy: only rows matching the current session tenant are visible
        DB::statement("
            CREATE POLICY tenant_isolation ON menu_items
            FOR ALL
            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
        ");
    }

    public function down(): void
    {
        DB::statement('DROP POLICY IF EXISTS tenant_isolation ON menu_items;');
        Schema::dropIfExists('menu_items');
    }
};
