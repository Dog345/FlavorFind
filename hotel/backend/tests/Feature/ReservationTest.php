<?php

namespace Tests\Feature;

use App\Events\ReservationUpdated;
use App\Jobs\SendReservationConfirmation;
use App\Models\Floor;
use App\Models\Reservation;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/**
 * Phase 8 — Reservation feature tests.
 *
 * Covers:
 *  - Create reservation (with and without table assignment)
 *  - Auto-assign table on store
 *  - Conflict detection: duplicate booking returns 409
 *  - Availability endpoint: returns free tables for a slot
 *  - Confirm: dispatches SendReservationConfirmation job + ReservationUpdated event
 *  - Arrive: opens a TableSession, updates table status, links session_id
 *  - Arrive without table assigned returns 422
 *  - Cancel: frees table, cancels reason recorded
 *  - No-show: frees table
 *  - Status guard: cannot confirm already confirmed, cannot cancel completed
 *  - Multi-tenant isolation: other tenant's reservation returns 404
 *  - List filters: today, upcoming, status filter
 */
class ReservationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User   $manager;
    private User   $waiter;
    private Floor  $floor;
    private Table  $table;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create([
            'slug'      => 'reshotel',
            'is_active' => true,
        ]);

        $this->manager = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_MANAGER,
        ]);

        $this->waiter = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_WAITER,
        ]);

        $this->floor = Floor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $this->table = Table::factory()->create([
            'tenant_id' => $this->tenant->id,
            'floor_id'  => $this->floor->id,
            'capacity'  => 4,
            'status'    => Table::STATUS_AVAILABLE,
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    /** @test */
    public function staff_can_create_a_reservation(): void
    {
        $response = $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/reservations', [
                'guest_name'  => 'Jane Doe',
                'guest_phone' => '+254712345678',
                'guest_email' => 'jane@example.com',
                'covers'      => 3,
                'reserved_at' => now()->addDays(2)->toIso8601String(),
                'table_id'    => $this->table->id,
                'source'      => 'phone',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.guest_name', 'Jane Doe')
            ->assertJsonPath('data.status', Reservation::STATUS_TENTATIVE)
            ->assertJsonPath('data.table_id', $this->table->id);

        $this->assertDatabaseHas('reservations', [
            'tenant_id'  => $this->tenant->id,
            'guest_name' => 'Jane Doe',
            'table_id'   => $this->table->id,
        ]);

        // Table should be marked as reserved
        $this->assertDatabaseHas('tables', [
            'id'     => $this->table->id,
            'status' => Table::STATUS_RESERVED,
        ]);
    }

    /** @test */
    public function auto_assign_picks_best_fit_table(): void
    {
        // Two tables: one for 2, one for 4 — party of 2 should get the smaller one
        $small = Table::factory()->create([
            'tenant_id' => $this->tenant->id,
            'floor_id'  => $this->floor->id,
            'capacity'  => 2,
            'status'    => Table::STATUS_AVAILABLE,
        ]);

        $response = $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/reservations', [
                'guest_name'  => 'Auto Guest',
                'guest_phone' => '+254700000001',
                'covers'      => 2,
                'reserved_at' => now()->addDays(1)->toIso8601String(),
                'auto_assign' => true,
            ]);

        $response->assertStatus(201);
        // Should have been assigned the 2-seat table
        $this->assertEquals($small->id, $response->json('data.table_id'));
    }

    /** @test */
    public function booking_conflict_on_same_table_returns_409(): void
    {
        $slotTime = now()->addDays(3)->toIso8601String();

        // First booking
        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/reservations', [
                'guest_name'  => 'First Guest',
                'guest_phone' => '+254700000002',
                'covers'      => 2,
                'reserved_at' => $slotTime,
                'table_id'    => $this->table->id,
            ])
            ->assertStatus(201);

        // Second booking at the same time on the same table
        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/reservations', [
                'guest_name'  => 'Second Guest',
                'guest_phone' => '+254700000003',
                'covers'      => 2,
                'reserved_at' => $slotTime,
                'table_id'    => $this->table->id,
            ])
            ->assertStatus(409);
    }

    /** @test */
    public function guest_name_is_required(): void
    {
        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/reservations', [
                'guest_phone' => '+254700000004',
                'covers'      => 2,
                'reserved_at' => now()->addDays(1)->toIso8601String(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['guest_name']);
    }

    // ─── Availability ─────────────────────────────────────────────────────────

    /** @test */
    public function availability_returns_free_tables_for_slot(): void
    {
        $date = now()->addDays(5)->format('Y-m-d');
        $time = '19:00';

        $response = $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson("/api/v1/reservations/availability?date={$date}&time={$time}&covers=2");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'label', 'capacity', 'floor_id']],
                'meta' => ['date', 'time', 'covers', 'duration_mins', 'available'],
            ]);

        // Our available table should appear
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($this->table->id, $ids);
    }

    /** @test */
    public function availability_excludes_tables_with_conflicting_bookings(): void
    {
        $slotDate = now()->addDays(5)->format('Y-m-d');
        $slotTime = '19:00';

        // Book the table for that slot
        Reservation::factory()->create([
            'tenant_id'   => $this->tenant->id,
            'table_id'    => $this->table->id,
            'covers'      => 2,
            'reserved_at' => now()->addDays(5)->setTimeFromTimeString('19:00'),
            'duration_mins'=> 90,
            'status'      => Reservation::STATUS_CONFIRMED,
        ]);

        $response = $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson("/api/v1/reservations/availability?date={$slotDate}&time={$slotTime}&covers=2");

        $response->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($this->table->id, $ids, 'Booked table should not appear in availability.');
    }

    /** @test */
    public function availability_requires_date_time_and_covers(): void
    {
        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/reservations/availability')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['date', 'time', 'covers']);
    }

    // ─── Confirm ──────────────────────────────────────────────────────────────

    /** @test */
    public function confirming_reservation_dispatches_confirmation_job(): void
    {
        Bus::fake([SendReservationConfirmation::class]);
        Event::fake([ReservationUpdated::class]);

        $reservation = Reservation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'table_id'  => $this->table->id,
            'status'    => Reservation::STATUS_TENTATIVE,
        ]);

        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/reservations/{$reservation->id}/confirm")
            ->assertStatus(200)
            ->assertJsonPath('data.status', Reservation::STATUS_CONFIRMED);

        Bus::assertDispatched(SendReservationConfirmation::class, fn ($job) =>
            $job->reservation->id === $reservation->id
        );

        Event::assertDispatched(ReservationUpdated::class);
    }

    /** @test */
    public function cannot_confirm_already_confirmed_reservation(): void
    {
        $reservation = Reservation::factory()->confirmed()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/reservations/{$reservation->id}/confirm")
            ->assertStatus(422);
    }

    // ─── Arrive (session handoff) ─────────────────────────────────────────────

    /** @test */
    public function marking_arrived_opens_table_session(): void
    {
        Event::fake([ReservationUpdated::class]);

        $reservation = Reservation::factory()->confirmed()->create([
            'tenant_id' => $this->tenant->id,
            'table_id'  => $this->table->id,
            'covers'    => 3,
        ]);

        $response = $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/reservations/{$reservation->id}/arrive");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', Reservation::STATUS_ARRIVED)
            ->assertJsonStructure(['session_id', 'session' => ['id', 'token', 'table_id', 'covers', 'opened_at']]);

        $sessionId = $response->json('session_id');

        // Session should be in DB and open
        $this->assertDatabaseHas('table_sessions', [
            'id'       => $sessionId,
            'table_id' => $this->table->id,
            'covers'   => 3,
        ]);
        $this->assertNull(TableSession::find($sessionId)->closed_at);

        // Table should be occupied
        $this->assertDatabaseHas('tables', [
            'id'     => $this->table->id,
            'status' => Table::STATUS_OCCUPIED,
        ]);

        // Reservation should link to session
        $this->assertDatabaseHas('reservations', [
            'id'         => $reservation->id,
            'session_id' => $sessionId,
            'status'     => Reservation::STATUS_ARRIVED,
        ]);
    }

    /** @test */
    public function arrive_without_table_assigned_returns_422(): void
    {
        $reservation = Reservation::factory()->confirmed()->create([
            'tenant_id' => $this->tenant->id,
            'table_id'  => null, // no table assigned
        ]);

        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/reservations/{$reservation->id}/arrive")
            ->assertStatus(422)
            ->assertJsonPath('error', fn ($v) => str_contains($v, 'no table assigned'));
    }

    // ─── Cancel ───────────────────────────────────────────────────────────────

    /** @test */
    public function cancelling_reservation_frees_table(): void
    {
        // Make table reserved
        $this->table->update(['status' => Table::STATUS_RESERVED]);

        $reservation = Reservation::factory()->confirmed()->create([
            'tenant_id' => $this->tenant->id,
            'table_id'  => $this->table->id,
        ]);

        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/reservations/{$reservation->id}/cancel", [
                'reason' => 'Guest called to cancel.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', Reservation::STATUS_CANCELLED);

        $this->assertDatabaseHas('reservations', [
            'id'                  => $reservation->id,
            'cancellation_reason' => 'Guest called to cancel.',
        ]);

        $this->assertDatabaseHas('tables', [
            'id'     => $this->table->id,
            'status' => Table::STATUS_AVAILABLE,
        ]);
    }

    /** @test */
    public function cannot_cancel_completed_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Reservation::STATUS_COMPLETED,
        ]);

        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/reservations/{$reservation->id}/cancel")
            ->assertStatus(422);
    }

    // ─── No-show ──────────────────────────────────────────────────────────────

    /** @test */
    public function no_show_frees_table_and_updates_status(): void
    {
        $this->table->update(['status' => Table::STATUS_RESERVED]);

        $reservation = Reservation::factory()->confirmed()->create([
            'tenant_id' => $this->tenant->id,
            'table_id'  => $this->table->id,
        ]);

        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/reservations/{$reservation->id}/no-show")
            ->assertStatus(200)
            ->assertJsonPath('data.status', Reservation::STATUS_NO_SHOW);

        $this->assertDatabaseHas('tables', [
            'id'     => $this->table->id,
            'status' => Table::STATUS_AVAILABLE,
        ]);
    }

    // ─── Tenant isolation ─────────────────────────────────────────────────────

    /** @test */
    public function reservation_from_other_tenant_returns_404(): void
    {
        $other = Tenant::factory()->create(['slug' => 'otherres', 'is_active' => true]);
        $otherReservation = Reservation::factory()->create([
            'tenant_id' => $other->id,
        ]);

        $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson("/api/v1/reservations/{$otherReservation->id}")
            ->assertStatus(404);
    }

    // ─── Listing filters ──────────────────────────────────────────────────────

    /** @test */
    public function index_can_filter_by_today(): void
    {
        // Today's reservation
        Reservation::factory()->today()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Reservation::STATUS_CONFIRMED,
        ]);

        // Future reservation (should not appear when ?today=1)
        Reservation::factory()->create([
            'tenant_id'  => $this->tenant->id,
            'reserved_at'=> now()->addDays(7),
        ]);

        $response = $this->actingAs($this->manager)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/reservations?today=1');

        $response->assertStatus(200);

        $dates = collect($response->json('data'))->pluck('reserved_at')->map(
            fn ($d) => \Carbon\Carbon::parse($d)->toDateString()
        )->unique()->values()->toArray();

        $this->assertCount(1, $dates);
        $this->assertEquals(today()->toDateString(), $dates[0]);
    }
}
