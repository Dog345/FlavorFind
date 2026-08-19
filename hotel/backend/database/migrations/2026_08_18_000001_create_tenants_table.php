<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name');
            $table->string('slug')->unique();                   // used in subdomain + API header
            $table->string('custom_domain')->nullable()->unique();
            $table->string('logo_url')->nullable();
            $table->string('primary_color', 7)->default('#16a34a'); // hex
            $table->string('subscription_tier', 20)->default('starter'); // starter|pro|enterprise
            $table->jsonb('features_enabled')->default('[]');
            // M-Pesa credentials per tenant (stored encrypted ideally)
            $table->string('mpesa_paybill')->nullable();
            $table->string('mpesa_till')->nullable();
            $table->text('mpesa_consumer_key')->nullable();
            $table->text('mpesa_consumer_secret')->nullable();
            $table->text('mpesa_passkey')->nullable();
            $table->string('mpesa_shortcode')->nullable();
            $table->string('mpesa_env', 10)->default('sandbox'); // sandbox|production
            $table->boolean('is_active')->default(true);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamps();
        });

        DB::statement("CREATE INDEX tenants_slug_idx ON tenants (slug)");
        DB::statement("CREATE INDEX tenants_custom_domain_idx ON tenants (custom_domain) WHERE custom_domain IS NOT NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
