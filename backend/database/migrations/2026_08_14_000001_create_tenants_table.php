<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name');
            $table->string('slug')->unique();           // e.g. "westlands-grill"
            $table->string('custom_domain')->nullable(); // e.g. "menu.westlandsgrill.com"
            $table->string('logo_url')->nullable();
            $table->string('primary_color', 20)->default('#0f172a');
            $table->jsonb('features_enabled')->default('{"tier":"starter"}');
            $table->string('mpesa_paybill')->nullable();
            $table->string('mpesa_till')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
