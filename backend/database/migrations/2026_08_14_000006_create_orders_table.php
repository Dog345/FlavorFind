<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->string('table_number')->nullable();
            $table->jsonb('items_json');                  // Full snapshot of ordered items + customisations
            $table->decimal('total_amount', 10, 2);
            $table->string('customer_phone')->nullable();  // For M-Pesa STK Push

            // M-Pesa payment tracking
            $table->string('mpesa_checkout_request_id')->nullable(); // Safaricom's reference
            $table->string('mpesa_receipt')->nullable();             // Confirmation receipt number
            $table->string('mpesa_status')->default('pending');      // pending | paid | failed | cancelled

            // Kitchen order status
            $table->string('order_status')->default('received');     // received | prep | ready | completed

            $table->text('notes')->nullable();             // Special instructions from guest
            $table->timestamps();

            // Indexes for common queries
            $table->index('mpesa_status');
            $table->index('order_status');
            $table->index('created_at');
        });

        DB::statement('ALTER TABLE orders ENABLE ROW LEVEL SECURITY;');

        DB::statement("
            CREATE POLICY tenant_isolation ON orders
            FOR ALL
            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
        ");
    }

    public function down(): void
    {
        DB::statement('DROP POLICY IF EXISTS tenant_isolation ON orders;');
        Schema::dropIfExists('orders');
    }
};
