<?php

namespace Database\Factories;

use App\Models\Floor;
use App\Models\Table;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Table>
 */
class TableFactory extends Factory
{
    protected $model = Table::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'floor_id'  => Floor::factory(),
            'label'     => 'T' . str_pad($this->faker->numberBetween(1, 99), 2, '0', STR_PAD_LEFT),
            'capacity'  => $this->faker->randomElement([2, 4, 4, 6, 8]),
            'status'    => Table::STATUS_AVAILABLE,
            'is_active' => true,
        ];
    }

    public function occupied(): static
    {
        return $this->state(['status' => Table::STATUS_OCCUPIED]);
    }

    public function reserved(): static
    {
        return $this->state(['status' => Table::STATUS_RESERVED]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
