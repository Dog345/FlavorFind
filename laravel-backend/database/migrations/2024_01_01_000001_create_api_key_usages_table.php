<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_key_usages', function (Blueprint $table) {
            $table->id();
            // Stores a hash of the key (never the raw key) for identification
            $table->string('key_hash', 64)->index();
            $table->unsignedSmallInteger('key_index'); // position in keys array (0-based)
            $table->date('usage_date')->index();
            $table->unsignedInteger('request_count')->default(0);
            $table->boolean('exhausted')->default(false);
            $table->timestamps();

            $table->unique(['key_hash', 'usage_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_key_usages');
    }
};
