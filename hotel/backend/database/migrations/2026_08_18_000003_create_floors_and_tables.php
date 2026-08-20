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
            $table->string('name');
            $table->smallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('tables', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->uuid('floor_id')->nullable();
            $table->foreign('floor_id')->references('id')->on('floors')->onDelete('set null');
            $table->string('label', 20);                             // T1, Table 5, Private Room
            $table->unsignedSmallInteger('capacity')->default(4);    // number of seats
            $table->string('status', 20)->default('available');      // available|occupied|reserved|cleaning|inactive
            $table->string('qr_code', 512)->nullable();              // base64 data URI or URL to QR image
            $table->jsonb('position')->nullable();                   // {x, y} for floor-plan rendering
            $table->boolean('is_active')->default(true);
            $table->uuid('current_session_id')->nullable();          // set when occupied
            $table->timestamps();
        });

        DB::statement('CREATE INDEX floors_tenant_idx ON floors (tenant_id, sort_order)');
        DB::statement('CREATE INDEX tables_tenant_status_idx ON tables (tenant_id, status)');
        DB::statement('CREATE INDEX tables_tenant_label_idx ON tables (tenant_id, label)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
        Schema::dropIfExists('floors');
    }
};
