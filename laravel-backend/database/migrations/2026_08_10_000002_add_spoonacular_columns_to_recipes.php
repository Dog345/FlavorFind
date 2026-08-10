<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            // Add missing columns from Spoonacular data
            if (!Schema::hasColumn('recipes', 'prep_minutes')) {
                $table->integer('prep_minutes')->default(0)->after('ready_minutes');
            }
            
            if (!Schema::hasColumn('recipes', 'cook_minutes')) {
                $table->integer('cook_minutes')->default(30)->after('prep_minutes');
            }
            
            if (!Schema::hasColumn('recipes', 'review_count')) {
                $table->integer('review_count')->default(0)->after('rating');
            }
            
            if (!Schema::hasColumn('recipes', 'category')) {
                $table->string('category')->nullable()->after('dish_types');
            }
            
            if (!Schema::hasColumn('recipes', 'author')) {
                $table->string('author')->nullable()->after('category');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->dropColumn([
                'prep_minutes',
                'cook_minutes', 
                'review_count',
                'category',
                'author'
            ]);
        });
    }
};
