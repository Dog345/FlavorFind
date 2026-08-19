<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-tenant auto-incrementing order number sequence
        DB::statement("CREATE SEQUENCE IF NOT EXISTS order_number_seq");

        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('table_session_id')->nullable();
            $table->foreign('table_session_id')->references('id')->on('table_sessions')->onDelete('set null');
            $table->uuid('table_id')->nullable();
            $table->foreign('table_id')->references('id')->on('tables')->onDelete('set null');
            $table->uuid('taken_by')->nullable();               // waiter user_id
            $table->foreign('taken_by')->references('id')->on('users')->onDelete('set null');
            $table->integer('order_number');                    // per-tenant sequential
            $table->string('status', 20)->default('pending');   // pending|confirmed|prep|ready|served|cancelled|closed
            $table->string('payment_status', 20)->default('unpaid'); // unpaid|partial|paid|refunded
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->string('order_type', 20)->default('dine_in'); // dine_in|takeaway|delivery
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('order_id');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->uuid('menu_item_id');
            $table->foreign('menu_item_id')->references('id')->on('menu_items')->onDelete('restrict');
            $table->uuid('variant_id')->nullable();
            $table->foreign('variant_id')->references('id')->on('item_variants')->onDelete('set null');
            $table->smallInteger('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);               // price at time of order
            $table->jsonb('modifiers_json')->default('[]');      // snapshot of modifiers chosen
            $table->text('special_instructions')->nullable();
            $table->string('status', 20)->default('pending');   // pending|prep|ready|served
            $table->timestamps();
        });

        // Trigger: auto-assign per-tenant order_number
        DB::statement("
            CREATE OR REPLACE FUNCTION assign_order_number()
            RETURNS TRIGGER AS \$\$
            DECLARE
                next_num INTEGER;
            BEGIN
                SELECT COALESCE(MAX(order_number), 0) + 1
                INTO next_num
                FROM orders
                WHERE tenant_id = NEW.tenant_id;

                NEW.order_number := next_num;
                RETURN NEW;
            END;
            \$\$ LANGUAGE plpgsql;
        ");

        DB::statement("
            CREATE TRIGGER trg_order_number
            BEFORE INSERT ON orders
            FOR EACH ROW EXECUTE FUNCTION assign_order_number();
        ");

        DB::statement("CREATE INDEX orders_tenant_status_idx ON orders (tenant_id, status)");
        DB::statement("CREATE INDEX orders_tenant_payment_idx ON orders (tenant_id, payment_status)");
        DB::statement("CREATE INDEX orders_tenant_created_idx ON orders (tenant_id, created_at DESC)");
        DB::statement("CREATE INDEX orders_table_session_idx ON orders (table_session_id)");
        DB::statement("CREATE INDEX order_items_order_idx ON order_items (order_id)");
        DB::statement("CREATE INDEX order_items_status_idx ON order_items (order_id, status)");
    }

    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS trg_order_number ON orders");
        DB::statement("DROP FUNCTION IF EXISTS assign_order_number()");
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        DB::statement("DROP SEQUENCE IF EXISTS order_number_seq");
    }
};
