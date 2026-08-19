<?php

namespace Database\Factories;

use App\Models\Table;
use App\Models\TableSession;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TableSession>
 */
class TableSessionFactory extends Factory
{
    protected $model = TableSession::class;

    public function definition(): array
    {
        return [
            'tenant_id'  => Tenant::factory(),
            'table_id'   => Table::factory(),
            'waiter_id'  => null,
            'covers'     => $this->faker->numberBetween(1, 8),
            'guest_name' => $this->faker->optional()->name(),
            'token'      => Str::uuid()->toString(),
            'opened_at'  => now()->subHours(1),
            'closed_at'  => null,
        ];
    }

    public function closed(): static
    {
        return $this->state([
            'closed_at' => now(),
        ]);
    }
}
