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

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['session_id']);
            $table->dropColumn('session_id');
        });
    }
};
