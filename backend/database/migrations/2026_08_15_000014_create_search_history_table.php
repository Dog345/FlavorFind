<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_history', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            // Nullable — guests can search too, we still log for analytics
            $table->uuid('user_id')->nullable();
            // The ingredient UUIDs the user searched with
            $table->jsonb('ingredient_ids')->default('[]');
            // Human-readable snapshot of ingredient names at search time
            $table->jsonb('ingredient_names')->default('[]');
            // How many recipes the search returned
            $table->integer('result_count')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')
                  ->references('id')->on('flavorfind_users')
                  ->onDelete('set null');
        });

        // Fast lookup: given user_id, get recent searches
        DB::statement('CREATE INDEX sh_user_created_idx ON search_history (user_id, created_at DESC)');
        // Analytics: search volume over time (no user filter)
        DB::statement('CREATE INDEX sh_created_idx ON search_history (created_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('search_history');
    }
};
