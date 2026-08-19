<?php

namespace Database\Factories;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuItem>
 */
class MenuItemFactory extends Factory
{
    protected $model = MenuItem::class;

    public function definition(): array
    {
        return [
            'tenant_id'   => Tenant::factory(),
            'category_id' => MenuCategory::factory(),
            'name'        => $this->faker->randomElement([
                'Beef Burger', 'Chicken Tikka', 'Nyama Choma', 'Pilau Rice',
                'Grilled Tilapia', 'Chips', 'Chapati', 'Ugali', 'Samosa',
                'Tusker Lager', 'Dawa Cocktail', 'Fresh Juice', 'Soda',
            ]) . ' ' . $this->faker->numberBetween(1, 99),
            'base_price'    => $this->faker->randomFloat(2, 100, 2000),
            'is_available'  => true,
            'is_active'     => true,
            'prep_time_min' => $this->faker->numberBetween(5, 30),
            'sort_order'    => $this->faker->numberBetween(0, 50),
        ];
    }

    public function unavailable(): static
    {
        return $this->state(['is_available' => false]);
    }
}
