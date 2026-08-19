<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        return [
            'name'              => $this->faker->company() . ' Hotel',
            'slug'              => $this->faker->unique()->slug(2),
            'is_active'         => true,
            'subscription_tier' => Tenant::TIER_STARTER,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    public function pro(): static
    {
        return $this->state(['subscription_tier' => Tenant::TIER_PRO]);
    }
}
