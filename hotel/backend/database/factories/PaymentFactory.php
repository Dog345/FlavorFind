<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'id'        => Str::uuid()->toString(),
            'tenant_id' => Tenant::factory(),
            'order_id'  => Order::factory(),
            'method'    => Payment::METHOD_CASH,
            'status'    => Payment::STATUS_COMPLETED,
            'amount'    => $this->faker->randomFloat(2, 100, 5000),
            'paid_at'   => now(),
        ];
    }

    public function mpesa(): static
    {
        return $this->state([
            'method' => Payment::METHOD_MPESA,
            'phone'  => '+254' . $this->faker->numerify('#########'),
        ]);
    }

    public function external(): static
    {
        return $this->state([
            'method'             => Payment::METHOD_EXTERNAL,
            'external_reference' => 'REF-' . strtoupper($this->faker->lexify('??????')),
        ]);
    }

    public function pending(): static
    {
        return $this->state([
            'status'  => Payment::STATUS_PENDING,
            'paid_at' => null,
        ]);
    }
}
