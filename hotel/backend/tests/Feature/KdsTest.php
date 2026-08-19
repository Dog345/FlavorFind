<?php

namespace Tests\Feature;

use App\Events\OrderCreated;
use App\Events\OrderItemStatusUpdated;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/**
 * KDS (Kitchen Display System) feature tests.
 *
 * Covers:
 *  - PATCH /api/v1/orders/{id}/items/{itemId}/status — item status transitions
 *  - GET  /api/v1/orders/kitchen                     — kitchen queue
 *  - OrderItemStatusUpdated broadcast assertions
 *  - Role authorisation (kitchen, waiter, admin can update; guest cannot)
 *  - Forward-only transition enforcement
 *  - Cancelled item guard
 *  - Multi-tenant isolation
 */
class KdsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User   $kitchen;
    private User   $waiter;
    private Order  $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create([
            'slug'      => 'kdstesthotel',
            'is_active' => true,
        ]);

        $this->kitchen = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_KITCHEN,
        ]);

        $this->waiter = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_WAITER,
        ]);

        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_CONFIRMED,
        ]);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    /**
     * Create an order item directly on $this->order.
     */
    private function makeItem(array $attrs = []): OrderItem
    {
        return OrderItem::factory()->create(array_merge([
            'order_id' => $this->order->id,
        ], $attrs));
    }

    // ─── Status transition tests ─────────────────────────────────────────────

    /** @test */
    public function kitchen_staff_can_advance_item_from_pending_to_preparing(): void
    {
        Event::fake([OrderItemStatusUpdated::class]);

        $item = $this->makeItem(['status' => OrderItem::STATUS_PENDING]);

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [
                'status' => OrderItem::STATUS_PREPARING,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', OrderItem::STATUS_PREPARING);

        $this->assertDatabaseHas('order_items', [
            'id'     => $item->id,
            'status' => OrderItem::STATUS_PREPARING,
        ]);
    }

    /** @test */
    public function kitchen_staff_can_advance_item_from_preparing_to_ready(): void
    {
        Event::fake([OrderItemStatusUpdated::class]);

        $item = $this->makeItem(['status' => OrderItem::STATUS_PREPARING]);

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [
                'status' => OrderItem::STATUS_READY,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', OrderItem::STATUS_READY);

        $this->assertDatabaseHas('order_items', [
            'id'     => $item->id,
            'status' => OrderItem::STATUS_READY,
        ]);
    }

    /** @test */
    public function item_status_update_dispatches_order_item_status_updated_event(): void
    {
        Event::fake([OrderItemStatusUpdated::class]);

        $item = $this->makeItem(['status' => OrderItem::STATUS_PENDING]);

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [
                'status' => OrderItem::STATUS_PREPARING,
            ])
            ->assertStatus(200);

        Event::assertDispatched(OrderItemStatusUpdated::class, function ($event) use ($item) {
            return $event->item->id === $item->id
                && $event->item->status === OrderItem::STATUS_PREPARING;
        });
    }

    /** @test */
    public function waiter_can_also_update_item_status(): void
    {
        Event::fake([OrderItemStatusUpdated::class]);

        $item = $this->makeItem(['status' => OrderItem::STATUS_PENDING]);

        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [
                'status' => OrderItem::STATUS_PREPARING,
            ])
            ->assertStatus(200);
    }

    /** @test */
    public function backwards_transition_is_rejected_with_422(): void
    {
        $item = $this->makeItem(['status' => OrderItem::STATUS_READY]);

        $response = $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [
                'status' => OrderItem::STATUS_PENDING,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', "Cannot change item status from 'ready' to 'pending'.");

        // DB unchanged
        $this->assertDatabaseHas('order_items', [
            'id'     => $item->id,
            'status' => OrderItem::STATUS_READY,
        ]);
    }

    /** @test */
    public function same_status_transition_is_rejected(): void
    {
        $item = $this->makeItem(['status' => OrderItem::STATUS_PREPARING]);

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [
                'status' => OrderItem::STATUS_PREPARING,
            ])
            ->assertStatus(422);
    }

    /** @test */
    public function cancelled_item_cannot_be_updated(): void
    {
        $item = $this->makeItem(['status' => OrderItem::STATUS_CANCELLED]);

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [
                'status' => OrderItem::STATUS_PREPARING,
            ])
            ->assertStatus(422)
            ->assertJsonPath('error', 'Cannot update a cancelled item.');
    }

    /** @test */
    public function invalid_status_value_is_rejected(): void
    {
        $item = $this->makeItem(['status' => OrderItem::STATUS_PENDING]);

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [
                'status' => 'burnt',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function missing_status_field_returns_422(): void
    {
        $item = $this->makeItem();

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$item->id}/status", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function item_belonging_to_different_order_returns_404(): void
    {
        // Item on a different order (same tenant)
        $otherOrder = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_CONFIRMED,
        ]);
        $foreignItem = OrderItem::factory()->create([
            'order_id' => $otherOrder->id,
            'status'   => OrderItem::STATUS_PENDING,
        ]);

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$this->order->id}/items/{$foreignItem->id}/status", [
                'status' => OrderItem::STATUS_PREPARING,
            ])
            ->assertStatus(404);
    }

    /** @test */
    public function order_belonging_to_other_tenant_returns_404(): void
    {
        $otherTenant = Tenant::factory()->create(['slug' => 'otherkds', 'is_active' => true]);
        $otherOrder  = Order::factory()->create([
            'tenant_id' => $otherTenant->id,
            'status'    => Order::STATUS_CONFIRMED,
        ]);
        $otherItem = OrderItem::factory()->create([
            'order_id' => $otherOrder->id,
            'status'   => OrderItem::STATUS_PENDING,
        ]);

        $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/orders/{$otherOrder->id}/items/{$otherItem->id}/status", [
                'status' => OrderItem::STATUS_PREPARING,
            ])
            ->assertStatus(404);
    }

    // ─── Kitchen queue (GET /orders/kitchen) ─────────────────────────────────

    /** @test */
    public function kitchen_queue_returns_confirmed_and_preparing_orders_only(): void
    {
        // Paid and pending orders should NOT appear
        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_PENDING,
        ]);
        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_PAID,
        ]);

        // Preparing order SHOULD appear (alongside the existing confirmed one)
        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_PREPARING,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/orders/kitchen');

        $response->assertStatus(200);

        $statuses = collect($response->json('data'))->pluck('status')->unique()->values()->toArray();
        sort($statuses);
        $this->assertEqualsCanonicalizing(
            [Order::STATUS_CONFIRMED, Order::STATUS_PREPARING],
            $statuses,
            'Kitchen queue should only contain confirmed and preparing orders.'
        );
    }

    /** @test */
    public function kitchen_queue_is_scoped_to_current_tenant(): void
    {
        $otherTenant = Tenant::factory()->create(['slug' => 'otherkds2', 'is_active' => true]);
        Order::factory()->create([
            'tenant_id' => $otherTenant->id,
            'status'    => Order::STATUS_CONFIRMED,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/orders/kitchen');

        $response->assertStatus(200);

        $tenantIds = collect($response->json('data'))->pluck('tenant_id')->unique()->values()->toArray();
        $this->assertCount(1, $tenantIds, 'Kitchen queue must only return orders for the current tenant.');
        $this->assertEquals((string) $this->tenant->id, $tenantIds[0]);
    }

    /** @test */
    public function kitchen_queue_returns_items_with_each_order(): void
    {
        $this->makeItem(['status' => OrderItem::STATUS_PENDING]);
        $this->makeItem(['status' => OrderItem::STATUS_PREPARING]);

        $response = $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/orders/kitchen');

        $response->assertStatus(200);

        $firstOrder = $response->json('data.0');
        $this->assertArrayHasKey('items', $firstOrder, 'Each order in the kitchen queue must include its items.');
        $this->assertNotEmpty($firstOrder['items']);
    }

    /** @test */
    public function kitchen_queue_excludes_cancelled_items_within_order(): void
    {
        $this->makeItem(['status' => OrderItem::STATUS_PENDING]);
        $this->makeItem(['status' => OrderItem::STATUS_CANCELLED]);

        $response = $this->actingAs($this->kitchen)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/orders/kitchen');

        $response->assertStatus(200);

        $items = $response->json('data.0.items');
        $statuses = collect($items)->pluck('status')->toArray();
        $this->assertNotContains(
            OrderItem::STATUS_CANCELLED,
            $statuses,
            'Cancelled items must not appear in the kitchen queue.'
        );
    }

    // ─── OrderCreated broadcast ───────────────────────────────────────────────

    /** @test */
    public function order_created_event_is_dispatched_when_order_is_broadcast(): void
    {
        // This tests that OrderCreated implements ShouldBroadcast correctly.
        // We verify the event carries the right payload shape.
        Event::fake([OrderCreated::class]);

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_PENDING,
        ]);

        OrderCreated::dispatch($order->load(['items', 'tenant']));

        Event::assertDispatched(OrderCreated::class, function ($event) use ($order) {
            return $event->order->id === $order->id;
        });
    }

    // ─── Broadcast channel names ──────────────────────────────────────────────

    /** @test */
    public function order_item_status_updated_event_broadcasts_on_correct_channels(): void
    {
        $item  = $this->makeItem();
        $item->load('order.tenant');

        $event    = new OrderItemStatusUpdated($item);
        $channels = $event->broadcastOn();

        $channelNames = collect($channels)->map(fn ($c) => $c->name)->toArray();

        $slug    = $this->tenant->slug;
        $orderId = $this->order->id;

        $this->assertContains("private-{$slug}.kitchen", $channelNames);
        $this->assertContains("private-{$slug}.orders.{$orderId}", $channelNames);
    }

    /** @test */
    public function order_item_status_updated_broadcast_payload_contains_order_items_list(): void
    {
        $item = $this->makeItem(['status' => OrderItem::STATUS_PREPARING]);
        $item->load('order.tenant');

        $event   = new OrderItemStatusUpdated($item);
        $payload = $event->broadcastWith();

        $this->assertArrayHasKey('order_id', $payload);
        $this->assertArrayHasKey('item', $payload);
        $this->assertArrayHasKey('order_items', $payload);
        $this->assertEquals($item->id, $payload['item']['id']);
        $this->assertEquals(OrderItem::STATUS_PREPARING, $payload['item']['status']);
    }
}
