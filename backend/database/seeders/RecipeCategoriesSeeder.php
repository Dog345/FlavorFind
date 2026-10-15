<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RecipeCategoriesSeeder extends Seeder
{
    /**
     * Seed the recipe_categories table.
     *
     * Names MUST match exactly what is stored in recipes.category.
     * Real categories in the DB (as of Oct 2026):
     *   Sides, Meat, Vegetable, Beans, Soups Crock Pot, Dessert,
     *   Lunch/Snacks, Beverages, Fish, Rice, Chicken, One Dish Meal, Breads
     *
     * image_url is initially null — upload images to Supabase storage
     * bucket "category-images" and update these rows with the public URL.
     *
     * Supabase storage path convention:
     *   https://<project>.supabase.co/storage/v1/object/public/category-images/<slug>.jpg
     */
    public function run(): void
    {
        $supabaseBase = 'https://ldvnpycfvnstxancdslf.supabase.co/storage/v1/object/public/category-images';

        $categories = [
            [
                'name'         => 'Chicken',
                'description'  => 'Braised, grilled, curried or stewed — chicken cooked the East African way, packed with flavour.',
                'image_url'    => "{$supabaseBase}/chicken.jpg",
                'accent_color' => '#e3c477',
                'sort_order'   => 1,
            ],
            [
                'name'         => 'Meat',
                'description'  => 'Bold cuts of beef, goat and lamb slow-cooked or fire-grilled to perfection.',
                'image_url'    => "{$supabaseBase}/meat.jpg",
                'accent_color' => '#d2622c',
                'sort_order'   => 2,
            ],
            [
                'name'         => 'Fish',
                'description'  => 'From Nile tilapia to coastal samaki — the freshest catch prepared with local spices.',
                'image_url'    => "{$supabaseBase}/fish.jpg",
                'accent_color' => '#4db6e0',
                'sort_order'   => 3,
            ],
            [
                'name'         => 'Vegetable',
                'description'  => 'Sukuma wiki, mchicha and more — vibrant greens and garden produce at their best.',
                'image_url'    => "{$supabaseBase}/vegetable.jpg",
                'accent_color' => '#7bc67e',
                'sort_order'   => 4,
            ],
            [
                'name'         => 'Beans',
                'description'  => 'Hearty githeri, maharagwe and bean stews — the backbone of everyday East African cooking.',
                'image_url'    => "{$supabaseBase}/beans.jpg",
                'accent_color' => '#c8a96e',
                'sort_order'   => 5,
            ],
            [
                'name'         => 'Rice',
                'description'  => 'Pilau, biryani and coconut rice — fragrant rice dishes that steal the show.',
                'image_url'    => "{$supabaseBase}/rice.jpg",
                'accent_color' => '#f4e0a0',
                'sort_order'   => 6,
            ],
            [
                'name'         => 'Sides',
                'description'  => 'Ugali, chapati, mukimo — the essential sides that complete every East African plate.',
                'image_url'    => "{$supabaseBase}/sides.jpg",
                'accent_color' => '#8eb89a',
                'sort_order'   => 7,
            ],
            [
                'name'         => 'Soups Crock Pot',
                'description'  => 'Slow-simmered soups and stews that warm you from the inside — rich, deep and comforting.',
                'image_url'    => "{$supabaseBase}/soups.jpg",
                'accent_color' => '#e07b5a',
                'sort_order'   => 8,
            ],
            [
                'name'         => 'Dessert',
                'description'  => 'Mandazi, mahamri and sweet treats infused with coconut, cardamom and tropical fruit.',
                'image_url'    => "{$supabaseBase}/dessert.jpg",
                'accent_color' => '#c77dff',
                'sort_order'   => 9,
            ],
            [
                'name'         => 'Breads',
                'description'  => 'Chapati, naan and East African flatbreads — freshly made and impossible to resist.',
                'image_url'    => "{$supabaseBase}/breads.jpg",
                'accent_color' => '#e9c46a',
                'sort_order'   => 10,
            ],
            [
                'name'         => 'Beverages',
                'description'  => 'Spiced chai, ginger brews, tamarind juice — drinks that tell a story in every sip.',
                'image_url'    => "{$supabaseBase}/beverages.jpg",
                'accent_color' => '#6bbfa0',
                'sort_order'   => 11,
            ],
            [
                'name'         => 'Lunch/Snacks',
                'description'  => 'Samosas, bhajia and quick bites perfect for any time of day.',
                'image_url'    => "{$supabaseBase}/snacks.jpg",
                'accent_color' => '#f4a261',
                'sort_order'   => 12,
            ],
            [
                'name'         => 'One Dish Meal',
                'description'  => 'Complete, satisfying meals all in one pot — minimal effort, maximum flavour.',
                'image_url'    => "{$supabaseBase}/one-dish.jpg",
                'accent_color' => '#80cbc4',
                'sort_order'   => 13,
            ],
        ];

        foreach ($categories as $cat) {
            DB::table('recipe_categories')->upsert(
                array_merge($cat, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]),
                ['name'],           // conflict key
                ['description', 'image_url', 'accent_color', 'sort_order', 'updated_at']
            );
        }

        $this->command->info('Seeded ' . count($categories) . ' recipe categories.');
    }
}
