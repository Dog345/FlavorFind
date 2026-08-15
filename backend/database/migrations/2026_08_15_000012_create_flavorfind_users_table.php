<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flavorfind_users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('avatar_url')->nullable();
            // Dietary preferences for personalisation
            $table->jsonb('dietary_preferences')->default('[]'); // e.g. ["vegetarian","gluten-free"]
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        DB::statement('CREATE INDEX ff_users_email_idx ON flavorfind_users (email)');
    }

    public function down(): void
    {
        Schema::dropIfExists('flavorfind_users');
    }
};
