<?php

namespace Tests\Feature;

use App\Events\PaymentReceived;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ExternalPaymentTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User   $cashier;
    private Order  $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['slug' => 'exthotel', 'is_active' => true]);

        $this->cashier = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_CASHIER,
        ]);

        $this->order = Order::factory()->create([
            'tenant_id'    => $this->tenant->id,
            'status'       => Order::STATUS_SERVED,
            'total_amount' => 2500.00,
        ]);
    }

    /** @test */
    public function cashier_can_record_external_payment_with_reference(): void
    {
        Event::fake([PaymentReceived::class]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/external", [
                'amount'             => 2500.00,
                'external_reference' => 'TXN-VISA-98765',
                'external_provider'  => 'Visa',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('amount', 2500.0)
            ->assertJsonPath('external_reference', 'TXN-VISA-98765')
            ->assertJsonPath('external_provider', 'Visa')
            ->assertJsonPath('order_status', Order::STATUS_PAID)
            ->assertJsonPath('outstanding_after', 0.0);

        $this->assertDatabaseHas('payments', [
            'order_id'           => $this->order->id,
            'method'             => Payment::METHOD_EXTERNAL,
            'status'             => Payment::STATUS_COMPLETED,
            'amount'             => 2500.00,
            'external_reference' => 'TXN-VISA-98765',
            'external_provider'  => 'Visa',
        ]);

        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => Order::STATUS_PAID,
        ]);
    }

    /** @test */
    public function external_payment_fires_payment_received_event(): void
    {
        Event::fake([PaymentReceived::class]);

        $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/external", [
                'amount'             => 2500.00,
                'external_reference' => 'BANK-REF-001',
            ]);

        Event::assertDispatched(PaymentReceived::class, function ($event) {
            return $event->payment->method === Payment::METHOD_EXTERNAL
                && $event->payment->status === Payment::STATUS_COMPLETED;
        });
    }

    /** @test */
    public function external_reference_is_required(): void
    {
        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/external", [
                'amount' => 2500.00,
                // missing external_reference
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['external_reference']);
    }

    /** @test */
    public function external_provider_is_optional(): void
    {
        Event::fake([PaymentReceived::class]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/external", [
                'amount'             => 2500.00,
                'external_reference' => 'EQUITY-TXN-555',
                // no external_provider
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('payments', [
            'external_reference' => 'EQUITY-TXN-555',
            'external_provider'  => null,
        ]);
    }

    /** @test */
    public function external_payment_rejected_on_already_paid_order(): void
    {
        $this->order->update(['status' => Order::STATUS_PAID]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/external", [
                'amount'             => 2500.00,
                'external_reference' => 'DUPE-REF-001',
            ]);

        $response->assertStatus(409);
    }

    /** @test */
    public function waiter_cannot_record_external_payment(): void
    {
        $waiter = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_WAITER,
        ]);

        $response = $this->actingAs($waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/external", [
                'amount'             => 2500.00,
                'external_reference' => 'TXN-VISA-11111',
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function split_external_payment_works_across_multiple_providers(): void
    {
        Event::fake([PaymentReceived::class]);

        // First split — Visa card 1500
        $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/external", [
                'amount'             => 1500.00,
                'external_reference' => 'VISA-001',
                'external_provider'  => 'Visa',
            ])
            ->assertStatus(201)
            ->assertJsonPath('order_status', Order::STATUS_SERVED)   // still open
            ->assertJsonPath('outstanding_after', 1000.0);

        // Second split — bank transfer 1000
        $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/external", [
                'amount'             => 1000.00,
                'external_reference' => 'BANK-TRANSFER-001',
                'external_provider'  => 'Equity Bank',
            ])
            ->assertStatus(201)
            ->assertJsonPath('order_status', Order::STATUS_PAID)
            ->assertJsonPath('outstanding_after', 0.0);

        $this->assertDatabaseCount('payments', 2);

        Event::assertDispatched(PaymentReceived::class, 2);
    }

    /** @test */
    public function external_payment_scoped_to_current_tenant(): void
    {
        // Order belonging to a different tenant
        $otherTenant = Tenant::factory()->create(['slug' => 'othertenant', 'is_active' => true]);
        $otherOrder  = Order::factory()->create([
            'tenant_id'    => $otherTenant->id,
            'status'       => Order::STATUS_SERVED,
            'total_amount' => 500.00,
        ]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$otherOrder->id}/payments/external", [
                'amount'             => 500.00,
                'external_reference' => 'CROSS-TENANT-REF',
            ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function payment_listing_returns_all_methods_for_tenant(): void
    {
        Event::fake([PaymentReceived::class]);

        // Record one of each type
        Payment::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $this->order->id,
            'method'    => Payment::METHOD_CASH,
            'status'    => Payment::STATUS_COMPLETED,
            'amount'    => 500.00,
        ]);

        Payment::factory()->create([
            'tenant_id'          => $this->tenant->id,
            'order_id'           => $this->order->id,
            'method'             => Payment::METHOD_EXTERNAL,
            'status'             => Payment::STATUS_COMPLETED,
            'amount'             => 500.00,
            'external_reference' => 'REF-XYZ',
        ]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/payments');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'method', 'status', 'amount', 'paid_at']],
                'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            ]);
    }

    /** @test */
    public function reconciliation_returns_totals_by_method(): void
    {
        Event::fake([PaymentReceived::class]);

        Payment::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $this->order->id,
            'method'    => Payment::METHOD_CASH,
            'status'    => Payment::STATUS_COMPLETED,
            'amount'    => 300.00,
            'paid_at'   => now(),
        ]);

        Payment::factory()->create([
            'tenant_id'          => $this->tenant->id,
            'order_id'           => $this->order->id,
            'method'             => Payment::METHOD_EXTERNAL,
            'status'             => Payment::STATUS_COMPLETED,
            'amount'             => 700.00,
            'external_reference' => 'VISA-REC',
            'paid_at'            => now(),
        ]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/payments/reconciliation');

        $response->assertStatus(200)
            ->assertJsonPath('grand_total', 1000.0)
            ->assertJsonStructure([
                'date',
                'grand_total',
                'by_method' => [['method', 'count', 'total']],
            ]);
    }
}
