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

class CashPaymentTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User   $cashier;
    private Order  $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['slug' => 'cashhotel', 'is_active' => true]);

        $this->cashier = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_CASHIER,
        ]);

        $this->order = Order::factory()->create([
            'tenant_id'    => $this->tenant->id,
            'status'       => Order::STATUS_SERVED,
            'total_amount' => 800.00,
        ]);
    }

    /** @test */
    public function cashier_can_record_exact_cash_payment(): void
    {
        Event::fake([PaymentReceived::class]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", [
                'amount_tendered' => 800.00,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('change_due', 0.0)
            ->assertJsonPath('order_status', Order::STATUS_PAID)
            ->assertJsonPath('outstanding_after', 0.0);

        $this->assertDatabaseHas('payments', [
            'order_id'        => $this->order->id,
            'method'          => Payment::METHOD_CASH,
            'status'          => Payment::STATUS_COMPLETED,
            'amount'          => 800.00,
            'amount_tendered' => 800.00,
            'change_due'      => 0.00,
        ]);

        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => Order::STATUS_PAID,
        ]);

        Event::assertDispatched(PaymentReceived::class);
    }

    /** @test */
    public function cashier_records_overpayment_and_calculates_correct_change(): void
    {
        Event::fake([PaymentReceived::class]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", [
                'amount_tendered' => 1000.00,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('change_due', 200.0)
            ->assertJsonPath('amount_applied', 800.0)
            ->assertJsonPath('order_status', Order::STATUS_PAID);

        $this->assertDatabaseHas('payments', [
            'order_id'        => $this->order->id,
            'amount'          => 800.00,   // only the outstanding applied
            'amount_tendered' => 1000.00,
            'change_due'      => 200.00,
        ]);
    }

    /** @test */
    public function cash_payment_fires_payment_received_event(): void
    {
        Event::fake([PaymentReceived::class]);

        $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", [
                'amount_tendered' => 800.00,
            ]);

        Event::assertDispatched(PaymentReceived::class, function ($event) {
            return $event->payment->method === Payment::METHOD_CASH
                && $event->payment->status === Payment::STATUS_COMPLETED;
        });
    }

    /** @test */
    public function waiter_cannot_record_cash_payment(): void
    {
        $waiter = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_WAITER,
        ]);

        $response = $this->actingAs($waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", [
                'amount_tendered' => 800.00,
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function cash_payment_rejected_on_already_paid_order(): void
    {
        $this->order->update(['status' => Order::STATUS_PAID]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", [
                'amount_tendered' => 800.00,
            ]);

        $response->assertStatus(409);
    }

    /** @test */
    public function it_validates_amount_tendered_is_required(): void
    {
        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount_tendered']);
    }

    /** @test */
    public function split_cash_payment_leaves_order_open_until_fully_covered(): void
    {
        Event::fake([PaymentReceived::class]);

        // First partial cash payment
        $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", [
                'amount_tendered' => 400.00,
            ])
            ->assertStatus(200)
            ->assertJsonPath('order_status', Order::STATUS_SERVED)    // still open
            ->assertJsonPath('outstanding_after', 400.0);

        // Second cash payment covers the rest
        $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", [
                'amount_tendered' => 400.00,
            ])
            ->assertStatus(200)
            ->assertJsonPath('order_status', Order::STATUS_PAID)
            ->assertJsonPath('outstanding_after', 0.0);

        $this->assertDatabaseCount('payments', 2);
    }

    /** @test */
    public function cashier_can_attach_notes_to_cash_payment(): void
    {
        Event::fake([PaymentReceived::class]);

        $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/cash", [
                'amount_tendered' => 800.00,
                'notes'           => 'Large denomination note received.',
            ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $this->order->id,
            'notes'    => 'Large denomination note received.',
        ]);
    }
}
