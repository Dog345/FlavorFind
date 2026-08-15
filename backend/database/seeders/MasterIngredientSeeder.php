<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterIngredientSeeder extends Seeder
{
    public function run(): void
    {
        // Batch insert for performance — no Eloquent overhead needed here
        $ingredients = $this->ingredients();

        $chunks = array_chunk($ingredients, 50);
        foreach ($chunks as $chunk) {
            DB::table('master_ingredients')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($ingredients) . ' master ingredients.');
    }

    private function ingredients(): array
    {
        $now = now()->toDateTimeString();

        // Format: name, category, allergen_flags (PostgreSQL array literal), description
        $rows = [
            // ── Proteins ─────────────────────────────────────────────────────
            ['name' => 'Chicken Breast',    'category' => 'protein',    'allergens' => '{}'],
            ['name' => 'Beef Mince',        'category' => 'protein',    'allergens' => '{}'],
            ['name' => 'Lamb Chops',        'category' => 'protein',    'allergens' => '{}'],
            ['name' => 'Goat Meat',         'category' => 'protein',    'allergens' => '{}'],
            ['name' => 'Tilapia Fillet',    'category' => 'protein',    'allergens' => '{fish}'],
            ['name' => 'Prawns',            'category' => 'protein',    'allergens' => '{shellfish}'],
            ['name' => 'Tuna',              'category' => 'protein',    'allergens' => '{fish}'],
            ['name' => 'Eggs',              'category' => 'protein',    'allergens' => '{eggs}'],
            ['name' => 'Tofu',              'category' => 'protein',    'allergens' => '{soy}'],
            ['name' => 'Lentils',           'category' => 'protein',    'allergens' => '{}'],

            // ── Vegetables ────────────────────────────────────────────────────
            ['name' => 'Tomato',            'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Onion',             'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Garlic',            'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Spinach',           'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Kale (Sukuma Wiki)','category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Capsicum',          'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Carrot',            'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Courgette',         'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Aubergine',         'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Sweet Potato',      'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Avocado',           'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Mushrooms',         'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Cabbage',           'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Leek',              'category' => 'vegetable',  'allergens' => '{}'],
            ['name' => 'Pumpkin',           'category' => 'vegetable',  'allergens' => '{}'],

            // ── Grains & Starches ─────────────────────────────────────────────
            ['name' => 'Ugali (Maize Flour)','category'=> 'grain',      'allergens' => '{}'],
            ['name' => 'White Rice',        'category' => 'grain',      'allergens' => '{}'],
            ['name' => 'Pasta',             'category' => 'grain',      'allergens' => '{gluten}'],
            ['name' => 'Bread',             'category' => 'grain',      'allergens' => '{gluten,eggs,dairy}'],
            ['name' => 'Chapati',           'category' => 'grain',      'allergens' => '{gluten}'],
            ['name' => 'Potatoes',          'category' => 'grain',      'allergens' => '{}'],
            ['name' => 'Wheat Flour',       'category' => 'grain',      'allergens' => '{gluten}'],
            ['name' => 'Oats',              'category' => 'grain',      'allergens' => '{gluten}'],

            // ── Dairy ─────────────────────────────────────────────────────────
            ['name' => 'Butter',            'category' => 'dairy',      'allergens' => '{dairy}'],
            ['name' => 'Cheddar Cheese',    'category' => 'dairy',      'allergens' => '{dairy}'],
            ['name' => 'Mozzarella',        'category' => 'dairy',      'allergens' => '{dairy}'],
            ['name' => 'Cream',             'category' => 'dairy',      'allergens' => '{dairy}'],
            ['name' => 'Yoghurt',           'category' => 'dairy',      'allergens' => '{dairy}'],
            ['name' => 'Milk',              'category' => 'dairy',      'allergens' => '{dairy}'],

            // ── Spices & Herbs ────────────────────────────────────────────────
            ['name' => 'Coriander',         'category' => 'spice',      'allergens' => '{}'],
            ['name' => 'Cumin',             'category' => 'spice',      'allergens' => '{}'],
            ['name' => 'Turmeric',          'category' => 'spice',      'allergens' => '{}'],
            ['name' => 'Ginger',            'category' => 'spice',      'allergens' => '{}'],
            ['name' => 'Chilli',            'category' => 'spice',      'allergens' => '{}'],
            ['name' => 'Paprika',           'category' => 'spice',      'allergens' => '{}'],
            ['name' => 'Rosemary',          'category' => 'spice',      'allergens' => '{}'],
            ['name' => 'Thyme',             'category' => 'spice',      'allergens' => '{}'],

            // ── Oils & Condiments ─────────────────────────────────────────────
            ['name' => 'Olive Oil',         'category' => 'condiment',  'allergens' => '{}'],
            ['name' => 'Coconut Oil',       'category' => 'condiment',  'allergens' => '{}'],
            ['name' => 'Soy Sauce',         'category' => 'condiment',  'allergens' => '{soy,gluten}'],
            ['name' => 'Honey',             'category' => 'condiment',  'allergens' => '{}'],
            ['name' => 'Lemon Juice',       'category' => 'condiment',  'allergens' => '{}'],
            ['name' => 'Coconut Milk',      'category' => 'condiment',  'allergens' => '{}'],
        ];

        // Map to DB row format, using PostgreSQL array literal for allergen_flags
        return array_map(fn ($r) => [
            'id'             => \Illuminate\Support\Str::uuid()->toString(),
            'name'           => $r['name'],
            'category'       => $r['category'],
            'allergen_flags' => $r['allergens'],  // stored as TEXT[] literal e.g. '{dairy,gluten}'
            'description'    => null,
            'created_at'     => $now,
            'updated_at'     => $now,
        ], $rows);
    }
}
