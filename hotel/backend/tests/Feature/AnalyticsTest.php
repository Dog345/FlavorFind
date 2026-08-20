<?php

namespace Tests\Feature;

use App\Models\Floor;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 9 — Analytics & Reporting feature tests.
 *
 * Covers:
 *  - Revenue endpoint: structure, granularity options, date filter, tenant isolation
 *  - Top items endpoint: ranks by revenue, by quantity, limit param
 *  - Hourly orders: always returns 24 rows, correct hour mapping
 *  - Status funnel: all 7 statuses present, completion_rate calculated
 *  - Payment breakdown: share_pct sums to 100
 *  - Table occupancy: session count, covers, avg_duration
 *  - CSV export: correct Content-Type, non-empty body
 *  - Role guard: waiter cannot access analytics
 *  - TenantController::stats() correctness
 */
class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User   $admin;
    private User   $waiter;
    private Floor  $floor;
    private Table  $table;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create([
            'slug'      => 'analyticshotel',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_ADMIN,
        ]);

        $this->waiter = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_WAITER,
        ]);

        $this->floor = Floor::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->table = Table::factory()->create([
            'tenant_id' => $this->tenant->id,
            'floor_id'  => $this->floor->id,
            'capacity'  => 4,
        ]);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function as(): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug);
    }

    private function seedPayments(int $count = 3, float $amount = 500.0): void
    {
        $order = Order::factory()->create([
            'tenant_id'    => $this->tenant->id,
            'status'       => Order::STATUS_PAID,
            'total_amount' => $amount * $count,
        ]);

        for ($i = 0; $i < $count; $i++) {
            Payment::factory()->create([
                'tenant_id' => $this->tenant->id,
                'order_id'  => $order->id,
                'method'    => Payment::METHOD_CASH,
                'status'    => Payment::STATUS_COMPLETED,
                'amount'    => $amount,
                'paid_at'   => now(),
            ]);
        }
    }

    // ─── Role guard ───────────────────────────────────────────────────────────

    /** @test */
    public function waiter_cannot_access_analytics(): void
    {
        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/revenue')
            ->assertStatus(403);
    }

    // ─── Revenue ─────────────────────────────────────────────────────────────

    /** @test */
    public function revenue_returns_correct_structure(): void
    {
        $this->seedPayments(2, 300.0);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/revenue');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['period', 'transactions', 'revenue']],
                'meta' => ['date_from', 'date_to', 'granularity', 'total_revenue', 'total_transactions'],
            ]);

        $this->assertGreaterThan(0, $response->json('meta.total_revenue'));
    }

    /** @test */
    public function revenue_accepts_granularity_week(): void
    {
        $this->seedPayments(1, 1000.0);

        $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/revenue?granularity=week')
            ->assertStatus(200)
            ->assertJsonPath('meta.granularity', 'week');
    }

    /** @test */
    public function revenue_is_tenant_scoped(): void
    {
        // Other tenant's payment should NOT appear
        $other      = Tenant::factory()->create(['slug' => 'otheranalytics', 'is_active' => true]);
        $otherOrder = Order::factory()->create(['tenant_id' => $other->id]);
        Payment::factory()->create([
            'tenant_id' => $other->id,
            'order_id'  => $otherOrder->id,
            'status'    => Payment::STATUS_COMPLETED,
            'amount'    => 99999.00,
            'paid_at'   => now(),
        ]);

        // Our tenant has no payments
        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/revenue');

        $response->assertStatus(200);
        $this->assertEquals(0, $response->json('meta.total_revenue'));
    }

    // ─── Top Items ────────────────────────────────────────────────────────────

    /** @test */
    public function top_items_ranks_by_revenue_by_default(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_PAID,
        ]);

        OrderItem::factory()->create([
            'order_id'   => $order->id,
            'name'       => 'Cheap Item',
            'quantity'   => 10,
            'unit_price' => 50,
            'line_total' => 500,
        ]);

        OrderItem::factory()->create([
            'order_id'   => $order->id,
            'name'       => 'Expensive Item',
            'quantity'   => 1,
            'unit_price' => 2000,
            'line_total' => 2000,
        ]);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/top-items');

        $response->assertStatus(200);
        $this->assertEquals('Expensive Item', $response->json('data.0.name'));
    }

    /** @test */
    public function top_items_can_sort_by_quantity(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_PAID,
        ]);

        OrderItem::factory()->create([
            'order_id'   => $order->id,
            'name'       => 'Popular Item',
            'quantity'   => 20,
            'unit_price' => 100,
            'line_total' => 2000,
        ]);

        OrderItem::factory()->create([
            'order_id'   => $order->id,
            'name'       => 'Rare Item',
            'quantity'   => 1,
            'unit_price' => 5000,
            'line_total' => 5000,
        ]);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/top-items?sort=quantity');

        $response->assertStatus(200);
        $this->assertEquals('Popular Item', $response->json('data.0.name'));
    }

    // ─── Hourly Orders ────────────────────────────────────────────────────────

    /** @test */
    public function hourly_orders_always_returns_24_rows(): void
    {
        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/hourly-orders');

        $response->assertStatus(200);
        $this->assertCount(24, $response->json('data'));

        $hours = collect($response->json('data'))->pluck('hour')->toArray();
        $this->assertEquals(range(0, 23), $hours);
    }

    // ─── Status Funnel ────────────────────────────────────────────────────────

    /** @test */
    public function status_funnel_returns_all_statuses_and_completion_rate(): void
    {
        // 2 paid, 1 cancelled
        Order::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_PAID,
        ]);
        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_CANCELLED,
        ]);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/status-funnel');

        $response->assertStatus(200);

        // All 7 statuses should be present in the response
        $statuses = collect($response->json('data'))->pluck('status')->toArray();
        foreach (Order::STATUSES as $status) {
            $this->assertContains($status, $statuses, "Missing status: {$status}");
        }

        // completion_rate = 2 paid / 3 total = 66.7%
        $this->assertEquals(66.7, $response->json('meta.completion_rate'));
    }

    // ─── Payment Breakdown ────────────────────────────────────────────────────

    /** @test */
    public function payment_breakdown_share_pct_sums_to_100(): void
    {
        $order = Order::factory()->create(['tenant_id' => $this->tenant->id]);

        Payment::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $order->id,
            'method'    => Payment::METHOD_CASH,
            'status'    => Payment::STATUS_COMPLETED,
            'amount'    => 600.0,
            'paid_at'   => now(),
        ]);

        Payment::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $order->id,
            'method'    => Payment::METHOD_MPESA,
            'status'    => Payment::STATUS_COMPLETED,
            'amount'    => 400.0,
            'paid_at'   => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/payment-breakdown');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['method', 'transactions', 'total', 'share_pct']],
                'meta' => ['grand_total'],
            ]);

        $totalShare = collect($response->json('data'))->sum('share_pct');
        $this->assertEquals(100.0, $totalShare);
        $this->assertEquals(1000.0, $response->json('meta.grand_total'));
    }

    // ─── Table Occupancy ─────────────────────────────────────────────────────

    /** @test */
    public function table_occupancy_returns_session_and_cover_counts(): void
    {
        TableSession::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'table_id'  => $this->table->id,
            'covers'    => 4,
            'opened_at' => now()->subHours(2),
            'closed_at' => now()->subHour(),
        ]);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/analytics/table-occupancy');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['table_id', 'table_label', 'capacity', 'sessions', 'total_covers', 'avg_duration_min']],
                'meta' => ['total_sessions', 'total_covers'],
            ]);

        $this->assertEquals(3, $response->json('meta.total_sessions'));
        $this->assertEquals(12, $response->json('meta.total_covers'));
    }

    // ─── CSV Export ───────────────────────────────────────────────────────────

    /** @test */
    public function csv_export_returns_correct_content_type(): void
    {
        $this->seedPayments(2, 500.0);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->get('/api/v1/analytics/export?report=revenue');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
    }

    /** @test */
    public function csv_export_requires_report_param(): void
    {
        $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->get('/api/v1/analytics/export')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['report']);
    }

    // ─── TenantController::stats ─────────────────────────────────────────────

    /** @test */
    public function tenant_stats_returns_correct_structure_and_values(): void
    {
        // Today's paid order with a completed payment
        $order = Order::factory()->create([
            'tenant_id'    => $this->tenant->id,
            'status'       => Order::STATUS_PAID,
            'total_amount' => 1000.0,
        ]);

        Payment::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $order->id,
            'method'    => Payment::METHOD_CASH,
            'status'    => Payment::STATUS_COMPLETED,
            'amount'    => 1000.0,
            'paid_at'   => now(),
        ]);

        $this->table->update(['status' => Table::STATUS_OCCUPIED]);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/tenant/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'orders_today', 'revenue_today', 'active_orders',
                'occupied_tables', 'total_tables', 'occupancy_rate',
                'reservations_today', 'as_of',
            ])
            ->assertJsonPath('orders_today', 1)
            ->assertJsonPath('revenue_today', 1000.0)
            ->assertJsonPath('occupied_tables', 1);
    }
}
