<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('tenant_id')->nullable()->after('id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->string('role', 20)->default('waiter')->after('email'); // admin|manager|waiter|kitchen|cashier
            $table->string('phone', 20)->nullable()->after('role');
            $table->string('avatar_url')->nullable()->after('phone');
            $table->boolean('is_active')->default(true)->after('avatar_url');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
        });

        DB::statement("CREATE INDEX users_tenant_role_idx ON users (tenant_id, role)");
        DB::statement("CREATE INDEX users_tenant_email_idx ON users (tenant_id, email)");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn(['tenant_id', 'role', 'phone', 'avatar_url', 'is_active', 'last_login_at']);
        });
    }
};
