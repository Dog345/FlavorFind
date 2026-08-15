<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure pgvector extension is enabled (Supabase has it available)
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector;');

        Schema::create('master_ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name');                          // "Truffle Butter"
            $table->string('category')->nullable();          // "dairy", "spice", "protein", etc.
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Add Postgres-native columns that Blueprint doesn't support directly
        DB::statement('ALTER TABLE master_ingredients ADD COLUMN allergen_flags TEXT[] NULL;');
        DB::statement('ALTER TABLE master_ingredients ADD COLUMN flavor_vector vector(1536);');

        // Index for fast similarity search (cosine distance)
        DB::statement('CREATE INDEX ON master_ingredients USING ivfflat (flavor_vector vector_cosine_ops) WITH (lists = 100);');
    }

    public function down(): void
    {
        Schema::dropIfExists('master_ingredients');
    }
};
