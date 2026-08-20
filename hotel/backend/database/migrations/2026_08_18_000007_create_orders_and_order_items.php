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
            $table->uuid('session_id')->nullable();              // TableSession FK
            $table->foreign('session_id')->references('id')->on('table_sessions')->onDelete('set null');
            $table->uuid('table_id')->nullable();
            $table->foreign('table_id')->references('id')->on('tables')->onDelete('set null');
            $table->uuid('waiter_id')->nullable();
            $table->foreign('waiter_id')->references('id')->on('users')->onDelete('set null');
            $table->string('order_number', 20);                 // e.g. "#0042"
            $table->string('status', 20)->default('pending');   // pending|confirmed|preparing|ready|served|cancelled|paid
            $table->string('type', 20)->default('dine_in');     // dine_in|takeaway|delivery
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('kitchen_accepted_at')->nullable();
            $table->timestamp('kitchen_ready_at')->nullable();
            $table->timestamp('served_at')->nullable();
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
            $table->string('name');                             // snapshot of item name at order time
            $table->decimal('unit_price', 10, 2);              // snapshot of price at order time
            $table->smallInteger('quantity')->default(1);
            $table->decimal('line_total', 10, 2);              // unit_price * quantity + modifier deltas
            $table->jsonb('modifiers')->nullable();             // [{name, price_delta}]
            $table->text('notes')->nullable();                  // special instructions
            $table->string('status', 20)->default('pending');  // pending|preparing|ready|cancelled
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
        DB::statement("CREATE INDEX orders_tenant_created_idx ON orders (tenant_id, created_at DESC)");
        DB::statement("CREATE INDEX orders_session_idx ON orders (session_id)");
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
