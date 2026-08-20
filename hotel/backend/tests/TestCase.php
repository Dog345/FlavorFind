<?php

namespace Tests;

use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create a tenant + admin user and return both.
     * Use this in tests that need a full tenant context.
     *
     * @return array{tenant: Tenant, admin: User}
     */
    protected function createTenantWithAdmin(array $tenantAttrs = [], array $userAttrs = []): array
    {
        $tenant = Tenant::factory()->create(array_merge([
            'is_active' => true,
        ], $tenantAttrs));

        $admin = User::factory()->create(array_merge([
            'tenant_id' => $tenant->id,
            'role'      => User::ROLE_ADMIN,
        ], $userAttrs));

        return compact('tenant', 'admin');
    }

    /**
     * Create a served order for a tenant, ready for payment.
     */
    protected function createServedOrder(Tenant $tenant, float $total = 1000.00): Order
    {
        return Order::factory()->create([
            'tenant_id'    => $tenant->id,
            'status'       => Order::STATUS_SERVED,
            'total_amount' => $total,
        ]);
    }

    /**
     * Shorthand for authenticated requests with tenant slug header.
     */
    protected function asUser(User $user, string $tenantSlug): static
    {
        return $this->actingAs($user)->withHeader('X-Tenant-Slug', $tenantSlug);
    }
}
