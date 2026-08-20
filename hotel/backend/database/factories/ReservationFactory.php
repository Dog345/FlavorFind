<?php

namespace Database\Factories;

use App\Models\Reservation;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        return [
            'tenant_id'    => Tenant::factory(),
            'table_id'     => null,
            'session_id'   => null,
            'guest_name'   => $this->faker->name(),
            'guest_phone'  => '+254' . $this->faker->numerify('#########'),
            'guest_email'  => $this->faker->optional()->safeEmail(),
            'covers'       => $this->faker->numberBetween(1, 8),
            'reserved_at'  => now()->addDays($this->faker->numberBetween(1, 30)),
            'duration_min' => 90,
            'status'       => Reservation::STATUS_TENTATIVE,
            'notes'        => null,
            'source'       => 'phone',
        ];
    }

    public function confirmed(): static
    {
        return $this->state([
            'status'       => Reservation::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);
    }

    public function arrived(): static
    {
        return $this->state([
            'status'     => Reservation::STATUS_ARRIVED,
            'arrived_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status'       => Reservation::STATUS_CANCELLED,
            'cancelled_at' => now(),
        ]);
    }

    public function today(): static
    {
        return $this->state([
            'reserved_at' => now()->addHours(2),
        ]);
    }

    public function past(): static
    {
        return $this->state([
            'reserved_at' => now()->subDays(1),
        ]);
    }
}
