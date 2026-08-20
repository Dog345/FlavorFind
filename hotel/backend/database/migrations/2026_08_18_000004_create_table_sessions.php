<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('table_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('table_id');
            $table->foreign('table_id')->references('id')->on('tables')->onDelete('cascade');
            $table->uuid('waiter_id')->nullable();
            $table->foreign('waiter_id')->references('id')->on('users')->onDelete('set null');
            $table->unsignedSmallInteger('covers')->default(1);  // number of guests
            $table->string('guest_name')->nullable();
            $table->string('token', 64)->unique();               // QR self-service token
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        // Add FK from tables → table_sessions (deferred — avoids circular dependency during create)
        Schema::table('tables', function (Blueprint $table) {
            $table->foreign('current_session_id')->references('id')->on('table_sessions')->onDelete('set null');
        });

        DB::statement('CREATE INDEX ts_tenant_table_idx ON table_sessions (tenant_id, table_id)');
        DB::statement('CREATE INDEX ts_open_idx ON table_sessions (tenant_id) WHERE closed_at IS NULL');
        DB::statement('CREATE INDEX ts_token_idx ON table_sessions (token)');
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropForeign(['current_session_id']);
        });
        Schema::dropIfExists('table_sessions');
    }
};
