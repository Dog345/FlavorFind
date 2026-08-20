<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'tenant_id'       => Tenant::factory(),
            'waiter_id'       => null,
            'table_id'        => null,
            'session_id'      => null,
            'order_number'    => '#' . str_pad($this->faker->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'status'          => Order::STATUS_PENDING,
            'type'            => Order::TYPE_DINE_IN,
            'subtotal'        => 800.00,
            'tax_amount'      => 128.00,
            'discount_amount' => 0.00,
            'total_amount'    => 928.00,
            'notes'           => null,
        ];
    }

    public function served(): static
    {
        return $this->state(['status' => Order::STATUS_SERVED]);
    }

    public function paid(): static
    {
        return $this->state(['status' => Order::STATUS_PAID]);
    }

    public function confirmed(): static
    {
        return $this->state(['status' => Order::STATUS_CONFIRMED]);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => Order::STATUS_CANCELLED]);
    }
}
