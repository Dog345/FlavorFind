<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * upsell_impressions — records every time an upsell suggestion was shown.
 *
 * An "impression" is created when the POS/guest app calls the suggestions
 * endpoint and a suggestion is rendered. It is "accepted" when the guest
 * actually adds the suggested item to their order.
 *
 * source:
 *   'manual'   — came from an UpsellRule configured by the manager
 *   'ai'       — came from the FlavorFind ingredient-pairing engine
 *
 * Conversion rate = accepted_count / impression_count per rule / source.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upsell_impressions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // Nullable — AI suggestions have no rule_id
            $table->uuid('upsell_rule_id')->nullable();
            $table->foreign('upsell_rule_id')->references('id')->on('upsell_rules')->onDelete('set null');

            $table->uuid('order_id');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');

            // The item that triggered the suggestion
            $table->uuid('trigger_item_id');
            $table->foreign('trigger_item_id')->references('id')->on('menu_items')->onDelete('cascade');

            // The item that was suggested
            $table->uuid('suggested_item_id');
            $table->foreign('suggested_item_id')->references('id')->on('menu_items')->onDelete('cascade');

            // Where did this suggestion come from?
            $table->string('source', 10)->default('manual'); // 'manual' | 'ai'

            // Was the suggestion acted upon?
            $table->boolean('accepted')->default(false);
            $table->timestamp('accepted_at')->nullable();

            // Snapshot of the prompt shown so analytics can track message effectiveness
            $table->string('prompt_text', 300)->nullable();

            $table->timestamp('shown_at')->useCurrent();
        });

        // Analytics queries: conversion by rule, by source, by date
        DB::statement('CREATE INDEX upsell_imp_tenant_rule_idx ON upsell_impressions (tenant_id, upsell_rule_id)');
        DB::statement('CREATE INDEX upsell_imp_tenant_source_idx ON upsell_impressions (tenant_id, source, shown_at DESC)');
        DB::statement('CREATE INDEX upsell_imp_order_idx ON upsell_impressions (order_id)');
        DB::statement('CREATE INDEX upsell_imp_accepted_idx ON upsell_impressions (tenant_id, accepted) WHERE accepted = true');
    }

    public function down(): void
    {
        Schema::dropIfExists('upsell_impressions');
    }
};
