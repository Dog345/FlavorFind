<?php

namespace Database\Factories;

use App\Models\MenuCategory;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuCategory>
 */
class MenuCategoryFactory extends Factory
{
    protected $model = MenuCategory::class;

    public function definition(): array
    {
        return [
            'tenant_id'  => Tenant::factory(),
            'name'       => $this->faker->randomElement([
                'Starters', 'Main Course', 'Desserts', 'Drinks', 'Sides', 'Grills', 'Soups',
            ]),
            'sort_order' => $this->faker->numberBetween(0, 20),
            'is_active'  => true,
        ];
    }
}
