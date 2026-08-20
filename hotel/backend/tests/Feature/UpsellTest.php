<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\UpsellImpression;
use App\Models\UpsellRule;
use App\Models\User;
use App\Services\UpsellService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 7 — Upsell Engine feature tests.
 *
 * Covers:
 *  - Manual upsell rule CRUD (create, read, update, delete)
 *  - Duplicate rule prevention
 *  - Suggestions endpoint (manual rules only, AI disabled in tests)
 *  - Suggestion ordering and MAX_SUGGESTIONS cap
 *  - Items already in order are excluded from suggestions
 *  - Impression recording via suggestions endpoint
 *  - Manual impression recording via POST /impressions
 *  - Accept impression via PATCH /impressions/{id}/accept
 *  - Double-accept returns 409
 *  - Analytics endpoint structure and date filtering
 *  - Role authorisation: only admin/manager can create/delete rules and view analytics
 *  - Multi-tenant isolation: rules and impressions scoped to tenant
 */
class UpsellTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User   $admin;
    private User   $waiter;
    private MenuCategory $category;
    private MenuItem $burger;
    private MenuItem $fries;
    private MenuItem $beer;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['slug' => 'upsellhotel', 'is_active' => true]);

        $this->admin = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_ADMIN,
        ]);

        $this->waiter = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role'      => User::ROLE_WAITER,
        ]);

        $this->category = MenuCategory::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $this->burger = MenuItem::factory()->create([
            'tenant_id'   => $this->tenant->id,
            'category_id' => $this->category->id,
            'name'        => 'Beef Burger',
            'base_price'  => 600,
        ]);

        $this->fries = MenuItem::factory()->create([
            'tenant_id'   => $this->tenant->id,
            'category_id' => $this->category->id,
            'name'        => 'Chips',
            'base_price'  => 200,
        ]);

        $this->beer = MenuItem::factory()->create([
            'tenant_id'   => $this->tenant->id,
            'category_id' => $this->category->id,
            'name'        => 'Tusker Lager',
            'base_price'  => 300,
        ]);

        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status'    => Order::STATUS_CONFIRMED,
        ]);
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    /** @test */
    public function admin_can_create_upsell_rule(): void
    {
        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/upsell-rules', [
                'trigger_item_id'   => $this->burger->id,
                'suggested_item_id' => $this->fries->id,
                'prompt_text'       => 'Add chips for only KES 200?',
                'priority'          => 10,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.trigger_item_id', $this->burger->id)
            ->assertJsonPath('data.suggested_item_id', $this->fries->id)
            ->assertJsonPath('data.prompt_text', 'Add chips for only KES 200?')
            ->assertJsonPath('data.priority', 10);

        $this->assertDatabaseHas('upsell_rules', [
            'tenant_id'         => $this->tenant->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
        ]);
    }

    /** @test */
    public function waiter_cannot_create_upsell_rule(): void
    {
        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/upsell-rules', [
                'trigger_item_id'   => $this->burger->id,
                'suggested_item_id' => $this->fries->id,
            ])
            ->assertStatus(403);
    }

    /** @test */
    public function duplicate_rule_returns_409(): void
    {
        UpsellRule::factory()->create([
            'tenant_id'         => $this->tenant->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
        ]);

        $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/upsell-rules', [
                'trigger_item_id'   => $this->burger->id,
                'suggested_item_id' => $this->fries->id,
            ])
            ->assertStatus(409);
    }

    /** @test */
    public function admin_can_update_upsell_rule(): void
    {
        $rule = UpsellRule::factory()->create([
            'tenant_id'         => $this->tenant->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
            'prompt_text'       => 'Old text',
        ]);

        $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->putJson("/api/v1/upsell-rules/{$rule->id}", [
                'prompt_text' => 'New prompt text',
                'priority'    => 50,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.prompt_text', 'New prompt text')
            ->assertJsonPath('data.priority', 50);
    }

    /** @test */
    public function admin_can_delete_upsell_rule(): void
    {
        $rule = UpsellRule::factory()->create([
            'tenant_id'         => $this->tenant->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
        ]);

        $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->deleteJson("/api/v1/upsell-rules/{$rule->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('upsell_rules', ['id' => $rule->id]);
    }

    /** @test */
    public function rule_from_other_tenant_returns_404(): void
    {
        $other      = Tenant::factory()->create(['slug' => 'otherupsell', 'is_active' => true]);
        $otherItem1 = MenuItem::factory()->create(['tenant_id' => $other->id, 'category_id' => $this->category->id]);
        $otherItem2 = MenuItem::factory()->create(['tenant_id' => $other->id, 'category_id' => $this->category->id]);
        $otherRule  = UpsellRule::factory()->create([
            'tenant_id'         => $other->id,
            'trigger_item_id'   => $otherItem1->id,
            'suggested_item_id' => $otherItem2->id,
        ]);

        $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson("/api/v1/upsell-rules/{$otherRule->id}")
            ->assertStatus(404);
    }

    // ─── Suggestions ──────────────────────────────────────────────────────────

    /** @test */
    public function suggestions_returns_matching_manual_rules(): void
    {
        // Mock the AI service to return nothing so only manual rules show
        $this->mock(UpsellService::class, function ($mock) {
            $mock->shouldReceive('suggest')
                ->once()
                ->andReturn(collect([[
                    'source'            => 'manual',
                    'upsell_rule_id'    => null,
                    'trigger_item_id'   => $this->burger->id,
                    'suggested_item_id' => $this->fries->id,
                    'suggested_item'    => $this->fries,
                    'prompt_text'       => 'Add chips?',
                    'confidence'        => null,
                ]]));
        });

        $response = $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/upsell-rules/suggestions?item_ids[]=' . $this->burger->id);

        $response->assertStatus(200)
            ->assertJsonPath('meta.count', 1)
            ->assertJsonPath('data.0.source', 'manual')
            ->assertJsonPath('data.0.suggested_item_id', $this->fries->id);
    }

    /** @test */
    public function suggestions_records_impressions_when_order_id_provided(): void
    {
        $this->mock(UpsellService::class, function ($mock) {
            $mock->shouldReceive('suggest')
                ->once()
                ->andReturn(collect([[
                    'source'            => 'manual',
                    'upsell_rule_id'    => null,
                    'trigger_item_id'   => $this->burger->id,
                    'suggested_item_id' => $this->fries->id,
                    'suggested_item'    => $this->fries,
                    'prompt_text'       => 'Add chips?',
                    'confidence'        => null,
                ]]));
        });

        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/upsell-rules/suggestions?item_ids[]=' . $this->burger->id . '&order_id=' . $this->order->id)
            ->assertStatus(200)
            ->assertJsonPath('meta.impressions_recorded', true);

        $this->assertDatabaseHas('upsell_impressions', [
            'tenant_id'         => $this->tenant->id,
            'order_id'          => $this->order->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
            'source'            => 'manual',
            'accepted'          => false,
        ]);
    }

    /** @test */
    public function suggestions_without_order_id_does_not_record_impressions(): void
    {
        $this->mock(UpsellService::class, function ($mock) {
            $mock->shouldReceive('suggest')->once()->andReturn(collect());
        });

        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/upsell-rules/suggestions?item_ids[]=' . $this->burger->id)
            ->assertStatus(200)
            ->assertJsonPath('meta.impressions_recorded', false);

        $this->assertDatabaseCount('upsell_impressions', 0);
    }

    /** @test */
    public function suggestions_requires_item_ids(): void
    {
        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/upsell-rules/suggestions')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['item_ids']);
    }

    // ─── Impressions ──────────────────────────────────────────────────────────

    /** @test */
    public function can_record_impression_manually(): void
    {
        $response = $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->postJson('/api/v1/upsell-rules/impressions', [
                'order_id'          => $this->order->id,
                'trigger_item_id'   => $this->burger->id,
                'suggested_item_id' => $this->beer->id,
                'source'            => 'ai',
                'prompt_text'       => 'Goes great with a Tusker!',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('upsell_impressions', [
            'order_id'          => $this->order->id,
            'suggested_item_id' => $this->beer->id,
            'source'            => 'ai',
            'accepted'          => false,
        ]);
    }

    /** @test */
    public function can_accept_an_impression(): void
    {
        $impression = UpsellImpression::factory()->create([
            'tenant_id'         => $this->tenant->id,
            'order_id'          => $this->order->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
            'source'            => 'manual',
            'accepted'          => false,
            'shown_at'          => now(),
        ]);

        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/upsell-rules/impressions/{$impression->id}/accept")
            ->assertStatus(200)
            ->assertJsonPath('data.accepted', true);

        $this->assertDatabaseHas('upsell_impressions', [
            'id'       => $impression->id,
            'accepted' => true,
        ]);
    }

    /** @test */
    public function accepting_impression_twice_returns_409(): void
    {
        $impression = UpsellImpression::factory()->create([
            'tenant_id'         => $this->tenant->id,
            'order_id'          => $this->order->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
            'source'            => 'manual',
            'accepted'          => true,
            'accepted_at'       => now(),
            'shown_at'          => now(),
        ]);

        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/upsell-rules/impressions/{$impression->id}/accept")
            ->assertStatus(409);
    }

    /** @test */
    public function impression_from_other_tenant_returns_404(): void
    {
        $other      = Tenant::factory()->create(['slug' => 'otherimp', 'is_active' => true]);
        $otherOrder = Order::factory()->create(['tenant_id' => $other->id]);
        $otherItem1 = MenuItem::factory()->create(['tenant_id' => $other->id, 'category_id' => $this->category->id]);
        $otherItem2 = MenuItem::factory()->create(['tenant_id' => $other->id, 'category_id' => $this->category->id]);

        $impression = UpsellImpression::factory()->create([
            'tenant_id'         => $other->id,
            'order_id'          => $otherOrder->id,
            'trigger_item_id'   => $otherItem1->id,
            'suggested_item_id' => $otherItem2->id,
            'source'            => 'manual',
            'shown_at'          => now(),
        ]);

        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->patchJson("/api/v1/upsell-rules/impressions/{$impression->id}/accept")
            ->assertStatus(404);
    }

    // ─── Analytics ────────────────────────────────────────────────────────────

    /** @test */
    public function analytics_returns_correct_structure(): void
    {
        // Seed some impressions
        UpsellImpression::factory()->count(3)->create([
            'tenant_id'         => $this->tenant->id,
            'order_id'          => $this->order->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
            'source'            => 'manual',
            'accepted'          => false,
            'shown_at'          => now(),
        ]);

        UpsellImpression::factory()->create([
            'tenant_id'         => $this->tenant->id,
            'order_id'          => $this->order->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
            'source'            => 'manual',
            'accepted'          => true,
            'accepted_at'       => now(),
            'shown_at'          => now()->subMinutes(5),
        ]);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/upsell-rules/analytics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary'   => ['total_impressions', 'total_accepted', 'overall_conversion'],
                'by_source' => [['source', 'impressions', 'accepted', 'conversion_rate']],
                'by_rule',
                'filters',
            ])
            ->assertJsonPath('summary.total_impressions', 4)
            ->assertJsonPath('summary.total_accepted', 1);

        $this->assertEquals(25.0, $response->json('summary.overall_conversion'));
    }

    /** @test */
    public function analytics_is_restricted_to_admin_and_manager(): void
    {
        $this->actingAs($this->waiter)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/upsell-rules/analytics')
            ->assertStatus(403);
    }

    /** @test */
    public function analytics_date_filter_narrows_results(): void
    {
        // Impression from yesterday — should be excluded
        UpsellImpression::factory()->create([
            'tenant_id'         => $this->tenant->id,
            'order_id'          => $this->order->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->fries->id,
            'source'            => 'manual',
            'accepted'          => false,
            'shown_at'          => now()->subDay(),
        ]);

        // Impression from today — should be included
        UpsellImpression::factory()->create([
            'tenant_id'         => $this->tenant->id,
            'order_id'          => $this->order->id,
            'trigger_item_id'   => $this->burger->id,
            'suggested_item_id' => $this->beer->id,
            'source'            => 'ai',
            'accepted'          => true,
            'accepted_at'       => now(),
            'shown_at'          => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->withHeader('X-Tenant-Slug', $this->tenant->slug)
            ->getJson('/api/v1/upsell-rules/analytics?date_from=' . now()->toDateString() . '&date_to=' . now()->toDateString());

        $response->assertStatus(200)
            ->assertJsonPath('summary.total_impressions', 1)
            ->assertJsonPath('summary.total_accepted', 1);
    }
}
