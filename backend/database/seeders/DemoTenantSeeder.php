<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\UpsellRule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoTenantSeeder extends Seeder
{
    public function run(): void
    {
        // ── Tenant 1: Westlands Grill ─────────────────────────────────────────
        $westlands = Tenant::create([
            'name'             => 'Westlands Grill',
            'slug'             => 'westlands-grill',
            'primary_color'    => '#C0392B',
            'features_enabled' => ['tier' => 'pro', 'upsell' => true, 'kds' => true],
            'is_active'        => true,
        ]);

        User::create([
            'tenant_id' => $westlands->id,
            'name'      => 'Admin Westlands',
            'email'     => 'admin@westlandsgrill.com',
            'password'  => Hash::make('password'),
            'role'      => 'admin',
        ]);

        $this->seedMenu($westlands->id, $this->westlandsMenu());
        $this->seedUpsellRules($westlands->id);

        // ── Tenant 2: Sankara Bistro ──────────────────────────────────────────
        $sankara = Tenant::create([
            'name'             => 'Sankara Bistro',
            'slug'             => 'sankara-bistro',
            'primary_color'    => '#1A5276',
            'features_enabled' => ['tier' => 'starter', 'upsell' => false, 'kds' => false],
            'is_active'        => true,
        ]);

        User::create([
            'tenant_id' => $sankara->id,
            'name'      => 'Admin Sankara',
            'email'     => 'admin@sankarabistro.com',
            'password'  => Hash::make('password'),
            'role'      => 'admin',
        ]);

        $this->seedMenu($sankara->id, $this->sankaraMenu());

        $this->command->info('Demo tenants seeded.');
        $this->command->info('  Westlands Grill — admin@westlandsgrill.com / password');
        $this->command->info('  Sankara Bistro  — admin@sankarabistro.com  / password');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function seedMenu(string $tenantId, array $items): array
    {
        $created = [];
        foreach ($items as $i => $item) {
            $created[] = MenuItem::create(array_merge($item, [
                'tenant_id'  => $tenantId,
                'sort_order' => $i,
                'is_available' => true,
            ]));
        }
        return $created;
    }

    private function seedUpsellRules(string $tenantId): void
    {
        // Load the items we just created for this tenant
        // RLS is NOT active here (seeder runs outside request context) — query directly
        $items = MenuItem::where('tenant_id', $tenantId)
            ->pluck('id', 'name');

        $rules = [
            ['trigger' => 'Nyama Choma',    'suggest' => 'Tusker Lager',       'prompt' => 'Pairs perfectly with a cold Tusker!'],
            ['trigger' => 'Beef Burger',    'suggest' => 'Crispy Fries',        'prompt' => 'Add fries to complete your meal.'],
            ['trigger' => 'Grilled Tilapia','suggest' => 'Kachumbari Salad',    'prompt' => 'Fresh kachumbari goes great with tilapia.'],
            ['trigger' => 'Club Sandwich',  'suggest' => 'Mango Juice',         'prompt' => 'Wash it down with fresh mango juice.'],
            ['trigger' => 'Chicken Wings',  'suggest' => 'Blue Cheese Dip',     'prompt' => 'Classic combo — wings + blue cheese.'],
        ];

        foreach ($rules as $rule) {
            $triggerId   = $items[$rule['trigger']]   ?? null;
            $suggestedId = $items[$rule['suggest']]   ?? null;

            if ($triggerId && $suggestedId) {
                UpsellRule::create([
                    'tenant_id'         => $tenantId,
                    'trigger_item_id'   => $triggerId,
                    'suggested_item_id' => $suggestedId,
                    'prompt_text'       => $rule['prompt'],
                    'priority'          => 10,
                    'is_active'         => true,
                ]);
            }
        }
    }

    // ── Menu data ─────────────────────────────────────────────────────────────

    private function westlandsMenu(): array
    {
        return [
            // Starters
            ['name' => 'Chicken Wings',     'category' => 'starters', 'base_price' => 650,  'description' => 'Crispy wings tossed in peri-peri sauce.',          'allergen_flags' => []],
            ['name' => 'Blue Cheese Dip',   'category' => 'starters', 'base_price' => 200,  'description' => 'House-made blue cheese dipping sauce.',             'allergen_flags' => ['dairy']],
            ['name' => 'Kachumbari Salad',  'category' => 'starters', 'base_price' => 350,  'description' => 'Tomato, onion, coriander, lime dressing.',          'allergen_flags' => []],
            // Mains
            ['name' => 'Nyama Choma',       'category' => 'mains',    'base_price' => 1200, 'description' => '500g grilled goat, served with ugali and sukuma.', 'allergen_flags' => []],
            ['name' => 'Grilled Tilapia',   'category' => 'mains',    'base_price' => 950,  'description' => 'Whole tilapia, charcoal-grilled with garlic butter.','allergen_flags' => ['fish']],
            ['name' => 'Beef Burger',       'category' => 'mains',    'base_price' => 750,  'description' => '180g beef patty, cheddar, brioche bun.',            'allergen_flags' => ['gluten', 'dairy']],
            ['name' => 'Club Sandwich',     'category' => 'mains',    'base_price' => 600,  'description' => 'Triple-decker with chicken, bacon, lettuce, tomato.','allergen_flags' => ['gluten', 'eggs']],
            ['name' => 'Crispy Fries',      'category' => 'sides',    'base_price' => 250,  'description' => 'Double-fried skin-on fries with sea salt.',          'allergen_flags' => []],
            // Drinks
            ['name' => 'Tusker Lager',      'category' => 'drinks',   'base_price' => 300,  'description' => 'Kenya\'s favourite cold lager, 500ml.',             'allergen_flags' => ['gluten']],
            ['name' => 'Mango Juice',       'category' => 'drinks',   'base_price' => 200,  'description' => 'Fresh-pressed Kenyan mango juice.',                 'allergen_flags' => []],
            ['name' => 'Dawa Cocktail',     'category' => 'drinks',   'base_price' => 550,  'description' => 'Vodka, honey, lime — Kenya\'s signature cocktail.', 'allergen_flags' => []],
            // Desserts
            ['name' => 'Mandazi',           'category' => 'desserts', 'base_price' => 150,  'description' => 'Swahili doughnuts served with chai.',               'allergen_flags' => ['gluten', 'eggs']],
            ['name' => 'Chocolate Lava Cake','category'=> 'desserts', 'base_price' => 450,  'description' => 'Warm chocolate cake with vanilla ice cream.',        'allergen_flags' => ['gluten', 'dairy', 'eggs']],
        ];
    }

    private function sankaraMenu(): array
    {
        return [
            // Starters
            ['name' => 'Soup of the Day',    'category' => 'starters', 'base_price' => 450,  'description' => 'Ask your server for today\'s selection.',          'allergen_flags' => []],
            ['name' => 'Bruschetta',         'category' => 'starters', 'base_price' => 550,  'description' => 'Grilled sourdough, heirloom tomatoes, fresh basil.','allergen_flags' => ['gluten']],
            // Mains
            ['name' => 'Pasta Arrabbiata',   'category' => 'mains',    'base_price' => 850,  'description' => 'Penne in spicy tomato sauce, parmesan.',            'allergen_flags' => ['gluten', 'dairy']],
            ['name' => 'Pan-Seared Salmon',  'category' => 'mains',    'base_price' => 1800, 'description' => 'Atlantic salmon, lemon butter, wilted spinach.',   'allergen_flags' => ['fish', 'dairy']],
            ['name' => 'Wagyu Burger',       'category' => 'mains',    'base_price' => 2200, 'description' => 'Wagyu beef, truffle aioli, brioche.',               'allergen_flags' => ['gluten', 'dairy', 'eggs']],
            ['name' => 'Caesar Salad',       'category' => 'mains',    'base_price' => 750,  'description' => 'Romaine, house dressing, parmesan, croutons.',      'allergen_flags' => ['gluten', 'dairy', 'eggs', 'fish']],
            // Drinks
            ['name' => 'House Red Wine',     'category' => 'drinks',   'base_price' => 800,  'description' => 'Glass of Cabernet Sauvignon.',                     'allergen_flags' => []],
            ['name' => 'Sparkling Water',    'category' => 'drinks',   'base_price' => 250,  'description' => 'San Pellegrino 500ml.',                            'allergen_flags' => []],
            ['name' => 'Espresso',           'category' => 'drinks',   'base_price' => 300,  'description' => 'Double shot, Kenyan AA beans.',                    'allergen_flags' => []],
            // Desserts
            ['name' => 'Crème Brûlée',       'category' => 'desserts', 'base_price' => 650,  'description' => 'Classic French vanilla custard, caramelised top.', 'allergen_flags' => ['dairy', 'eggs']],
            ['name' => 'Tiramisu',           'category' => 'desserts', 'base_price' => 600,  'description' => 'Mascarpone, espresso-soaked ladyfingers.',          'allergen_flags' => ['gluten', 'dairy', 'eggs']],
        ];
    }
}
