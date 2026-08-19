<?php

namespace Database\Factories;

use App\Models\MenuItem;
use App\Models\Tenant;
use App\Models\UpsellRule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UpsellRule>
 */
class UpsellRuleFactory extends Factory
{
    protected $model = UpsellRule::class;

    public function definition(): array
    {
        $tenant = Tenant::factory()->create();

        return [
            'tenant_id'         => $tenant->id,
            'trigger_item_id'   => MenuItem::factory()->create(['tenant_id' => $tenant->id])->id,
            'suggested_item_id' => MenuItem::factory()->create(['tenant_id' => $tenant->id])->id,
            'prompt_text'       => $this->faker->sentence(6),
            'priority'          => $this->faker->numberBetween(0, 10),
            'is_active'         => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
