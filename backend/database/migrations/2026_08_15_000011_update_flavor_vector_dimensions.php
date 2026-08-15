<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Use 768 dimensions — fits within pgvector 0.6.0 index limits (max 2000)
        // We truncate gemini-embedding-001's 3072-dim output to first 768 dims
        // 768 dims retains ~95% of semantic quality at 4x less storage
        DB::statement('ALTER TABLE master_ingredients DROP COLUMN IF EXISTS flavor_vector');
        DB::statement('ALTER TABLE master_ingredients ADD COLUMN flavor_vector vector(768)');

        // IVFFlat index for fast cosine similarity search
        DB::statement('CREATE INDEX ON master_ingredients USING ivfflat (flavor_vector vector_cosine_ops) WITH (lists = 100)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE master_ingredients DROP COLUMN IF EXISTS flavor_vector');
        DB::statement('ALTER TABLE master_ingredients ADD COLUMN flavor_vector vector(1536)');
    }
};
