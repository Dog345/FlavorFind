<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upsell_rules', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('trigger_item_id');
            $table->foreign('trigger_item_id')->references('id')->on('menu_items')->onDelete('cascade');
            $table->uuid('suggested_item_id');
            $table->foreign('suggested_item_id')->references('id')->on('menu_items')->onDelete('cascade');
            $table->string('prompt_text')->nullable(); // "Pairs perfectly with..." shown in the modal
            $table->integer('priority')->default(0);   // higher = shown first
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::statement('ALTER TABLE upsell_rules ENABLE ROW LEVEL SECURITY;');

        DB::statement("
            CREATE POLICY tenant_isolation ON upsell_rules
            FOR ALL
            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
        ");
    }

    public function down(): void
    {
        DB::statement('DROP POLICY IF EXISTS tenant_isolation ON upsell_rules;');
        Schema::dropIfExists('upsell_rules');
    }
};
