<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('floors', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->string('name');          // Ground Floor, Rooftop, etc.
            $table->smallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('tables', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('floor_id')->nullable();
            $table->foreign('floor_id')->references('id')->on('floors')->onDelete('set null');
            $table->string('name', 20);      // T1, Table 5, etc.
            $table->smallInteger('seats')->default(4);
            $table->string('qr_token', 64)->unique(); // random token for QR URL
            $table->string('status', 20)->default('free'); // free|occupied|reserved|cleaning
            $table->uuid('current_session_id')->nullable(); // set when occupied
            $table->timestamps();
        });

        DB::statement("CREATE INDEX floors_tenant_idx ON floors (tenant_id, sort_order)");
        DB::statement("CREATE INDEX tables_tenant_status_idx ON tables (tenant_id, status)");
        DB::statement("CREATE INDEX tables_qr_token_idx ON tables (qr_token)");
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
        Schema::dropIfExists('floors');
    }
};
