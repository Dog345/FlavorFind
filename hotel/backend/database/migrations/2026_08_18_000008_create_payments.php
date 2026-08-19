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

            // Payment method: mpesa | cash | card | external | complimentary
            $table->string('method', 20);

            // Unified status column (matches Payment model STATUS_* constants)
            $table->string('status', 20)->default('pending');

            // Amount fields
            $table->decimal('amount', 10, 2);
            $table->decimal('amount_tendered', 10, 2)->nullable();  // cash only
            $table->decimal('change_due', 10, 2)->nullable();       // cash only

            // Generic reference (used by external/card payments)
            $table->string('reference')->nullable();

            // M-Pesa specific columns (match model property names)
            $table->string('phone', 20)->nullable();
            $table->string('checkout_request_id')->nullable()->unique();
            $table->string('merchant_request_id')->nullable();
            $table->string('mpesa_receipt', 30)->nullable();

            // External payment specific
            $table->string('external_reference')->nullable();  // e.g. card terminal receipt, bank ref
            $table->string('external_provider')->nullable();   // e.g. "Visa", "Equity Bank", "POS"

            // Cashier who recorded this payment
            $table->uuid('cashier_id')->nullable();
            $table->foreign('cashier_id')->references('id')->on('users')->onDelete('set null');

            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();      // raw provider response
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        DB::statement('CREATE INDEX payments_tenant_order_idx ON payments (tenant_id, order_id)');
        DB::statement('CREATE INDEX payments_checkout_request_idx ON payments (checkout_request_id) WHERE checkout_request_id IS NOT NULL');
        DB::statement('CREATE INDEX payments_tenant_created_idx ON payments (tenant_id, created_at DESC)');
        DB::statement('CREATE INDEX payments_status_idx ON payments (status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
