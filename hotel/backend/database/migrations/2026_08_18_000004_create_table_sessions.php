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
            $table->uuid('opened_by')->nullable(); // user_id
            $table->foreign('opened_by')->references('id')->on('users')->onDelete('set null');
            $table->uuid('closed_by')->nullable(); // user_id
            $table->foreign('closed_by')->references('id')->on('users')->onDelete('set null');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->smallInteger('guest_count')->default(1);
            $table->text('notes')->nullable();
        });

        // Now add the FK from tables → table_sessions (was circular during create)
        Schema::table('tables', function (Blueprint $table) {
            $table->foreign('current_session_id')->references('id')->on('table_sessions')->onDelete('set null');
        });

        DB::statement("CREATE INDEX ts_tenant_table_idx ON table_sessions (tenant_id, table_id)");
        DB::statement("CREATE INDEX ts_open_idx ON table_sessions (tenant_id) WHERE closed_at IS NULL");
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropForeign(['current_session_id']);
        });
        Schema::dropIfExists('table_sessions');
    }
};
