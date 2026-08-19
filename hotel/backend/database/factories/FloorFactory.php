<?php

namespace Database\Factories;

use App\Models\Floor;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Floor>
 */
class FloorFactory extends Factory
{
    protected $model = Floor::class;

    public function definition(): array
    {
        return [
            'tenant_id'  => Tenant::factory(),
            'name'       => $this->faker->randomElement([
                'Ground Floor', 'First Floor', 'Rooftop', 'VIP Lounge', 'Garden', 'Terrace',
            ]),
            'sort_order' => $this->faker->numberBetween(0, 10),
            'is_active'  => true,
        ];
    }
}
