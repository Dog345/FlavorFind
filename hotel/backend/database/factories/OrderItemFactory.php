<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        return [
            'order_id'   => Order::factory(),
            'name'       => $this->faker->randomElement([
                'Grilled Chicken', 'Beef Burger', 'Chips', 'Caesar Salad',
                'Nyama Choma', 'Pilau Rice', 'Tilapia', 'Chapati',
            ]),
            'unit_price' => $this->faker->randomFloat(2, 100, 1500),
            'quantity'   => $this->faker->numberBetween(1, 5),
            'line_total' => function (array $attrs) {
                return round($attrs['unit_price'] * $attrs['quantity'], 2);
            },
            'modifiers'  => null,
            'notes'      => null,
            'status'     => OrderItem::STATUS_PENDING,
        ];
    }

    /** Item is being prepared in the kitchen. */
    public function preparing(): static
    {
        return $this->state(['status' => OrderItem::STATUS_PREPARING]);
    }

    /** Item is ready to serve. */
    public function ready(): static
    {
        return $this->state(['status' => OrderItem::STATUS_READY]);
    }

    /** Item has been cancelled. */
    public function cancelled(): static
    {
        return $this->state(['status' => OrderItem::STATUS_CANCELLED]);
    }
}
