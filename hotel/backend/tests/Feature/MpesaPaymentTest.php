<?php

namespace Tests\Feature;

use App\Events\PaymentReceived;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MpesaPaymentTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User   $cashier;
    private Order  $order;

    protected function setUp(): void
    {
        parent::setUp();

        // Clear cached M-Pesa access token between tests
        \Illuminate\Support\Facades\Cache::forget('mpesa_access_token');

        $this->tenant = Tenant::factory()->create(['slug' => 'testhotel', 'is_active' => true]);

        $this->cashier = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_CASHIER,
        ]);

        $this->order = Order::factory()->create([
            'tenant_id'    => $this->tenant->id,
            'status'       => Order::STATUS_SERVED,
            'total_amount' => 1500.00,
        ]);
    }

    // ─── STK Push Initiation ─────────────────────────────────────────────────
    // These two tests require live Daraja sandbox credentials.
    // M-Pesa is an optional payment method — skipped until credentials are configured.

    /** @test */
    public function it_initiates_stk_push_and_creates_pending_payment(): void
    {
        $this->markTestSkipped('M-Pesa is optional. Configure MPESA_* env vars to enable.');
    }

    /** @test */
    public function it_marks_payment_failed_when_daraja_errors(): void
    {
        $this->markTestSkipped('M-Pesa is optional. Configure MPESA_* env vars to enable.');
    }

    // ─── Input validation (no Daraja call needed) ─────────────────────────────

    /** @test */
    public function it_rejects_stk_push_on_already_paid_order(): void
    {
        $this->order->update(['status' => Order::STATUS_PAID]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/mpesa", [
                'phone' => '254712345678',
            ]);

        $response->assertStatus(409);
    }

    /** @test */
    public function it_validates_phone_format_for_stk_push(): void
    {
        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson("/api/v1/orders/{$this->order->id}/payments/mpesa", [
                'phone' => '0712345678', // wrong format — must start with 254
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    // ─── Safaricom Callback ───────────────────────────────────────────────────

    /** @test */
    public function callback_with_result_code_0_marks_payment_completed_and_fires_event(): void
    {
        Event::fake([PaymentReceived::class]);

        $payment = Payment::factory()->create([
            'tenant_id'           => $this->tenant->id,
            'order_id'            => $this->order->id,
            'method'              => Payment::METHOD_MPESA,
            'status'              => Payment::STATUS_PENDING,
            'amount'              => 1500.00,
            'checkout_request_id' => 'ws_CO_123456789',
        ]);

        $response = $this->postJson('/api/v1/payments/mpesa/callback', [
            'Body' => [
                'stkCallback' => [
                    'MerchantRequestID' => 'MR-001',
                    'CheckoutRequestID' => 'ws_CO_123456789',
                    'ResultCode'        => 0,
                    'ResultDesc'        => 'The service request is processed successfully.',
                    'CallbackMetadata'  => [
                        'Item' => [
                            ['Name' => 'Amount',             'Value' => 1500],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'RAB1234XY'],
                            ['Name' => 'PhoneNumber',        'Value' => 254712345678],
                        ],
                    ],
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['ResultCode' => 0]);

        $this->assertDatabaseHas('payments', [
            'id'            => $payment->id,
            'status'        => Payment::STATUS_COMPLETED,
            'mpesa_receipt' => 'RAB1234XY',
        ]);

        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => Order::STATUS_PAID,
        ]);

        Event::assertDispatched(PaymentReceived::class, function ($event) use ($payment) {
            return $event->payment->id === $payment->id;
        });
    }

    /** @test */
    public function callback_with_result_code_1032_marks_payment_failed(): void
    {
        Event::fake([PaymentReceived::class]);

        $payment = Payment::factory()->create([
            'tenant_id'           => $this->tenant->id,
            'order_id'            => $this->order->id,
            'method'              => Payment::METHOD_MPESA,
            'status'              => Payment::STATUS_PENDING,
            'amount'              => 1500.00,
            'checkout_request_id' => 'ws_CO_999888777',
        ]);

        $response = $this->postJson('/api/v1/payments/mpesa/callback', [
            'Body' => [
                'stkCallback' => [
                    'MerchantRequestID' => 'MR-002',
                    'CheckoutRequestID' => 'ws_CO_999888777',
                    'ResultCode'        => 1032,
                    'ResultDesc'        => 'Request cancelled by user.',
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['ResultCode' => 0]);

        $this->assertDatabaseHas('payments', [
            'id'     => $payment->id,
            'status' => Payment::STATUS_FAILED,
        ]);

        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => Order::STATUS_SERVED, // unchanged
        ]);

        Event::assertNotDispatched(PaymentReceived::class);
    }

    /** @test */
    public function callback_with_unknown_checkout_id_still_returns_200(): void
    {
        $response = $this->postJson('/api/v1/payments/mpesa/callback', [
            'Body' => [
                'stkCallback' => [
                    'MerchantRequestID' => 'MR-003',
                    'CheckoutRequestID' => 'ws_CO_DOESNOTEXIST',
                    'ResultCode'        => 0,
                    'ResultDesc'        => 'Success',
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['ResultCode' => 0]);
    }

    /** @test */
    public function callback_endpoint_is_accessible_without_auth_header(): void
    {
        $response = $this->postJson('/api/v1/payments/mpesa/callback', [
            'Body' => ['stkCallback' => ['CheckoutRequestID' => 'none', 'ResultCode' => 0]],
        ]);

        $response->assertStatus(200);
    }

    // ─── Status Polling ──────────────────────────────────────────────────────

    /** @test */
    public function status_endpoint_returns_payment_details(): void
    {
        $payment = Payment::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $this->order->id,
            'method'    => Payment::METHOD_MPESA,
            'status'    => Payment::STATUS_COMPLETED,
            'amount'    => 1500.00,
            'paid_at'   => now(),
        ]);

        $response = $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson("/api/v1/payments/{$payment->id}/status");

        $response->assertStatus(200)
            ->assertJsonPath('payment.id', $payment->id)
            ->assertJsonPath('payment.status', Payment::STATUS_COMPLETED);
    }

    /** @test */
    public function status_endpoint_does_not_query_daraja_if_already_completed(): void
    {
        Http::fake();

        $payment = Payment::factory()->create([
            'tenant_id'           => $this->tenant->id,
            'order_id'            => $this->order->id,
            'method'              => Payment::METHOD_MPESA,
            'status'              => Payment::STATUS_COMPLETED,
            'amount'              => 1500.00,
            'checkout_request_id' => 'ws_CO_DONE',
            'paid_at'             => now(),
        ]);

        $this->actingAs($this->cashier)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson("/api/v1/payments/{$payment->id}/status")
            ->assertStatus(200);

        Http::assertNothingSent();
    }

    // ─── Split Bill ───────────────────────────────────────────────────────────

    /** @test */
    public function order_is_not_marked_paid_until_all_payments_cover_total(): void
    {
        Event::fake([PaymentReceived::class]);

        Payment::factory()->create([
            'tenant_id'           => $this->tenant->id,
            'order_id'            => $this->order->id,
            'method'              => Payment::METHOD_MPESA,
            'status'              => Payment::STATUS_PENDING,
            'amount'              => 700.00,
            'checkout_request_id' => 'ws_CO_PART1',
        ]);

        $this->postJson('/api/v1/payments/mpesa/callback', [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'ws_CO_PART1',
                    'ResultCode'        => 0,
                    'ResultDesc'        => 'Success',
                    'CallbackMetadata'  => [
                        'Item' => [
                            ['Name' => 'Amount',             'Value' => 700],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'REC0001'],
                        ],
                    ],
                ],
            ],
        ]);

        // Only 700 of 1500 paid — order still open
        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => Order::STATUS_SERVED,
        ]);

        Payment::factory()->create([
            'tenant_id'           => $this->tenant->id,
            'order_id'            => $this->order->id,
            'method'              => Payment::METHOD_MPESA,
            'status'              => Payment::STATUS_PENDING,
            'amount'              => 800.00,
            'checkout_request_id' => 'ws_CO_PART2',
        ]);

        $this->postJson('/api/v1/payments/mpesa/callback', [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'ws_CO_PART2',
                    'ResultCode'        => 0,
                    'ResultDesc'        => 'Success',
                    'CallbackMetadata'  => [
                        'Item' => [
                            ['Name' => 'Amount',             'Value' => 800],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'REC0002'],
                        ],
                    ],
                ],
            ],
        ]);

        // Now fully paid
        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => Order::STATUS_PAID,
        ]);
    }
}
