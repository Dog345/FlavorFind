<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Upsell Rules ─────────────────────────────────────────────────────
        Schema::create('upsell_rules', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('trigger_item_id');
            $table->foreign('trigger_item_id')->references('id')->on('menu_items')->onDelete('cascade');
            $table->uuid('suggested_item_id');
            $table->foreign('suggested_item_id')->references('id')->on('menu_items')->onDelete('cascade');
            $table->string('prompt_text')->nullable();           // "Would you like garlic bread with that?"
            $table->smallInteger('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'trigger_item_id', 'suggested_item_id']);
        });

        // ── Reservations ─────────────────────────────────────────────────────
        Schema::create('reservations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('table_id')->nullable();
            $table->foreign('table_id')->references('id')->on('tables')->onDelete('set null');
            $table->uuid('session_id')->nullable();
            $table->foreign('session_id')->references('id')->on('table_sessions')->onDelete('set null');
            $table->string('guest_name');
            $table->string('guest_phone', 20)->nullable();
            $table->string('guest_email')->nullable();
            $table->smallInteger('covers')->default(1);         // number of guests (was party_size)
            $table->timestamp('reserved_at');
            $table->smallInteger('duration_mins')->default(90);
            $table->string('status', 20)->default('tentative'); // tentative|confirmed|arrived|completed|no_show|cancelled
            $table->text('notes')->nullable();
            $table->string('source', 30)->nullable();           // walk_in|phone|online|app
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('arrived_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
        });

        // ── Audit Logs ────────────────────────────────────────────────────────
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('action', 50);                        // created|updated|deleted|login|logout
            $table->string('model_type', 100)->nullable();
            $table->uuid('model_id')->nullable();
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // ── Notifications ─────────────────────────────────────────────────────
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('type', 50);                          // order_ready|payment_received|reservation_confirmed
            $table->string('title');
            $table->text('body')->nullable();
            $table->jsonb('data')->default('{}');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("CREATE INDEX upsell_trigger_idx ON upsell_rules (tenant_id, trigger_item_id) WHERE is_active = true");
        DB::statement("CREATE INDEX reservations_tenant_date_idx ON reservations (tenant_id, reserved_at)");
        DB::statement("CREATE INDEX reservations_status_idx ON reservations (tenant_id, status)");
        DB::statement("CREATE INDEX audit_logs_tenant_idx ON audit_logs (tenant_id, created_at DESC)");
        DB::statement("CREATE INDEX notifications_user_unread_idx ON notifications (user_id, created_at DESC) WHERE read_at IS NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('upsell_rules');
    }
};
