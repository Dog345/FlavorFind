<?php

namespace Database\Factories;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\UpsellImpression;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UpsellImpression>
 */
class UpsellImpressionFactory extends Factory
{
    protected $model = UpsellImpression::class;

    public function definition(): array
    {
        return [
            'tenant_id'         => Tenant::factory(),
            'upsell_rule_id'    => null,
            'order_id'          => Order::factory(),
            'trigger_item_id'   => MenuItem::factory(),
            'suggested_item_id' => MenuItem::factory(),
            'source'            => UpsellImpression::SOURCE_MANUAL,
            'accepted'          => false,
            'accepted_at'       => null,
            'prompt_text'       => $this->faker->sentence(5),
            'shown_at'          => now(),
        ];
    }

    public function accepted(): static
    {
        return $this->state([
            'accepted'    => true,
            'accepted_at' => now(),
        ]);
    }

    public function ai(): static
    {
        return $this->state(['source' => UpsellImpression::SOURCE_AI]);
    }
}
