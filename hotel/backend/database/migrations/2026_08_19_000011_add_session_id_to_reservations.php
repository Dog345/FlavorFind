<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds session_id to reservations.
 *
 * When a guest with a reservation arrives, the front-desk staff taps "Arrived"
 * which opens a new TableSession. That session ID is stored here so we can
 * link the reservation → session → orders for reporting.
 */
return new class extends Migration
{
    public function up(): void
    {
        // session_id was added to the main reservations migration.
        // This migration is kept for upgrade paths from older deployments.
        if (! Schema::hasColumn('reservations', 'session_id')) {
            Schema::table('reservations', function (Blueprint $table) {
                $table->uuid('session_id')
                    ->nullable()
                    ->after('table_id');

                $table->foreign('session_id')
                    ->references('id')
                    ->on('table_sessions')
                    ->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        // Only drop if we added it (i.e. not in the base migration)
    }
};
