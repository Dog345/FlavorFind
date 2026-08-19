<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('order_id');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->string('method', 20);                        // mpesa|cash|card
            $table->decimal('amount', 10, 2);
            // M-Pesa specific
            $table->string('mpesa_phone', 20)->nullable();
            $table->string('mpesa_checkout_request_id')->nullable()->unique();
            $table->string('mpesa_merchant_request_id')->nullable();
            $table->string('mpesa_receipt', 30)->nullable();
            $table->string('mpesa_status', 20)->nullable();      // pending|paid|failed|cancelled
            // Cash specific
            $table->uuid('cashier_id')->nullable();              // user_id
            $table->foreign('cashier_id')->references('id')->on('users')->onDelete('set null');
            $table->decimal('cash_tendered', 10, 2)->nullable();
            $table->decimal('cash_change', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        DB::statement("CREATE INDEX payments_tenant_order_idx ON payments (tenant_id, order_id)");
        DB::statement("CREATE INDEX payments_mpesa_checkout_idx ON payments (mpesa_checkout_request_id) WHERE mpesa_checkout_request_id IS NOT NULL");
        DB::statement("CREATE INDEX payments_tenant_created_idx ON payments (tenant_id, created_at DESC)");
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
