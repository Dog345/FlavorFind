<?php

namespace Database\Seeders;

use App\Models\Floor;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * MambaHotelSeeder
 *
 * Seeds a complete demo hotel called "Mamba Hotel & Restaurant" for testing.
 *
 * Creates:
 *   - 1 Tenant (slug: mamba)
 *   - 5 Users  (admin, manager, 2× waiter, kitchen)
 *   - 2 Floors (Ground Floor, First Floor)
 *   - 10 Tables (5 per floor)
 *   - 5 Menu Categories
 *   - 30 Menu Items (realistic Kenyan hotel menu)
 *   - 2 Open TableSessions (with known tokens for frontend testing)
 *
 * Run with: php artisan db:seed --class=MambaHotelSeeder
 *
 * Test QR tokens:
 *   Table 1  → token: mamba-table-1-token-0000000000001
 *   Table 2  → token: mamba-table-2-token-0000000000002
 */
class MambaHotelSeeder extends Seeder
{
    // Known tokens for easy frontend testing
    const TOKEN_TABLE_1 = 'mamba-table-1-token-0000000000001';
    const TOKEN_TABLE_2 = 'mamba-table-2-token-0000000000002';

    public function run(): void
    {
        $this->command->info('🐍 Seeding Mamba Hotel & Restaurant...');

        // ── Tenant ─────────────────────────────────────────────────────────────
        $tenant = Tenant::updateOrCreate(
            ['slug' => 'mamba'],
            [
                'name'              => 'Mamba Hotel & Restaurant',
                'slug'              => 'mamba',
                'logo_url'          => 'https://placehold.co/200x80/1a1a2e/ffffff?text=MAMBA',
                'primary_color'     => '#2dd4bf', // teal
                'subscription_tier' => Tenant::TIER_PRO,
                'features_enabled'  => ['qr_ordering', 'mpesa', 'upsell', 'reservations', 'analytics'],
                'mpesa_paybill'     => '400200',
                'mpesa_till'        => null,
                'is_active'         => true,
                'trial_ends_at'     => null,
            ]
        );

        $this->command->info("  ✓ Tenant: {$tenant->name} (ID: {$tenant->id})");

        // ── Users ──────────────────────────────────────────────────────────────
        $admin = User::updateOrCreate(
            ['email' => 'admin@mamba.co.ke'],
            [
                'name'      => 'James Kamau',
                'email'     => 'admin@mamba.co.ke',
                'password'  => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'role'      => User::ROLE_ADMIN,
            ]
        );

        $manager = User::updateOrCreate(
            ['email' => 'manager@mamba.co.ke'],
            [
                'name'      => 'Grace Mwangi',
                'email'     => 'manager@mamba.co.ke',
                'password'  => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'role'      => User::ROLE_MANAGER,
            ]
        );

        $waiter1 = User::updateOrCreate(
            ['email' => 'waiter1@mamba.co.ke'],
            [
                'name'      => 'Brian Otieno',
                'email'     => 'waiter1@mamba.co.ke',
                'password'  => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'role'      => User::ROLE_WAITER,
            ]
        );

        $waiter2 = User::updateOrCreate(
            ['email' => 'waiter2@mamba.co.ke'],
            [
                'name'      => 'Faith Njeri',
                'email'     => 'waiter2@mamba.co.ke',
                'password'  => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'role'      => User::ROLE_WAITER,
            ]
        );

        User::updateOrCreate(
            ['email' => 'kitchen@mamba.co.ke'],
            [
                'name'      => 'Chef Peter Waweru',
                'email'     => 'kitchen@mamba.co.ke',
                'password'  => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'role'      => User::ROLE_KITCHEN,
            ]
        );

        $this->command->info('  ✓ 5 users created (admin, manager, 2 waiters, kitchen)');

        // ── Floors ─────────────────────────────────────────────────────────────
        $groundFloor = Floor::updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Ground Floor'],
            ['tenant_id' => $tenant->id, 'name' => 'Ground Floor', 'sort_order' => 1]
        );

        $firstFloor = Floor::updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'First Floor'],
            ['tenant_id' => $tenant->id, 'name' => 'First Floor', 'sort_order' => 2]
        );

        $this->command->info('  ✓ 2 floors: Ground Floor, First Floor');

        // ── Tables ─────────────────────────────────────────────────────────────
        $tables = [];

        $groundTables = [
            ['label' => 'T1', 'capacity' => 2],
            ['label' => 'T2', 'capacity' => 4],
            ['label' => 'T3', 'capacity' => 4],
            ['label' => 'T4', 'capacity' => 6],
            ['label' => 'T5', 'capacity' => 8],
        ];

        foreach ($groundTables as $i => $t) {
            $tables[] = Table::updateOrCreate(
                ['tenant_id' => $tenant->id, 'floor_id' => $groundFloor->id, 'label' => $t['label']],
                [
                    'tenant_id' => $tenant->id,
                    'floor_id'  => $groundFloor->id,
                    'label'     => $t['label'],
                    'capacity'  => $t['capacity'],
                    'status'    => Table::STATUS_AVAILABLE,
                    'is_active' => true,
                ]
            );
        }

        $firstTables = [
            ['label' => 'F1', 'capacity' => 2],
            ['label' => 'F2', 'capacity' => 4],
            ['label' => 'F3', 'capacity' => 4],
            ['label' => 'F4', 'capacity' => 6],
            ['label' => 'F5', 'capacity' => 10],
        ];

        foreach ($firstTables as $t) {
            $tables[] = Table::updateOrCreate(
                ['tenant_id' => $tenant->id, 'floor_id' => $firstFloor->id, 'label' => $t['label']],
                [
                    'tenant_id' => $tenant->id,
                    'floor_id'  => $firstFloor->id,
                    'label'     => $t['label'],
                    'capacity'  => $t['capacity'],
                    'status'    => Table::STATUS_AVAILABLE,
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('  ✓ 10 tables seeded (5 Ground, 5 First Floor)');

        // ── Menu Categories + Items ────────────────────────────────────────────
        $this->seedMenu($tenant);

        // ── Open Table Sessions (with known tokens) ────────────────────────────
        // Clear any old test sessions first
        TableSession::where('tenant_id', $tenant->id)
            ->whereIn('token', [self::TOKEN_TABLE_1, self::TOKEN_TABLE_2])
            ->delete();

        $table1 = $tables[0]; // T1, Ground Floor
        $table2 = $tables[1]; // T2, Ground Floor

        TableSession::create([
            'tenant_id'  => $tenant->id,
            'table_id'   => $table1->id,
            'waiter_id'  => $waiter1->id,
            'covers'     => 2,
            'guest_name' => 'Test Guest',
            'token'      => self::TOKEN_TABLE_1,
            'opened_at'  => now()->subMinutes(10),
            'closed_at'  => null,
        ]);

        $table1->update(['status' => Table::STATUS_OCCUPIED]);

        TableSession::create([
            'tenant_id'  => $tenant->id,
            'table_id'   => $table2->id,
            'waiter_id'  => $waiter2->id,
            'covers'     => 4,
            'guest_name' => 'Demo Party',
            'token'      => self::TOKEN_TABLE_2,
            'opened_at'  => now()->subMinutes(5),
            'closed_at'  => null,
        ]);

        $table2->update(['status' => Table::STATUS_OCCUPIED]);

        $this->command->info('  ✓ 2 open table sessions seeded');
        $this->command->newLine();
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  MAMBA HOTEL TEST CREDENTIALS');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  Admin:   admin@mamba.co.ke   / password');
        $this->command->info('  Manager: manager@mamba.co.ke / password');
        $this->command->info('  Waiter:  waiter1@mamba.co.ke / password');
        $this->command->info('  Kitchen: kitchen@mamba.co.ke / password');
        $this->command->newLine();
        $this->command->info('  QR TOKEN (Table T1):');
        $this->command->info('  ' . self::TOKEN_TABLE_1);
        $this->command->info('  → GET /api/v1/guest/' . self::TOKEN_TABLE_1);
        $this->command->newLine();
        $this->command->info('  QR TOKEN (Table T2):');
        $this->command->info('  ' . self::TOKEN_TABLE_2);
        $this->command->info('  → GET /api/v1/guest/' . self::TOKEN_TABLE_2);
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // ── Menu ───────────────────────────────────────────────────────────────────

    private function seedMenu(Tenant $tenant): void
    {
        $menuData = [
            [
                'name'        => 'Starters',
                'description' => 'Light bites to begin your meal',
                'image_url'   => 'https://placehold.co/400x300/f97316/ffffff?text=Starters',
                'sort_order'  => 1,
                'items' => [
                    ['name' => 'Chicken Spring Rolls (4 pcs)',   'price' => 450,  'prep' => 10, 'tags' => ['popular'], 'desc' => 'Crispy rolls filled with seasoned chicken and vegetables, served with sweet chili sauce.'],
                    ['name' => 'Soup of the Day',                'price' => 350,  'prep' => 8,  'tags' => [],          'desc' => 'Chef\'s daily soup served with toasted bread.'],
                    ['name' => 'Prawn Cocktail',                 'price' => 750,  'prep' => 5,  'tags' => ['seafood'], 'desc' => 'Chilled prawns on a bed of lettuce with Marie Rose sauce.'],
                    ['name' => 'Bruschetta',                     'price' => 380,  'prep' => 7,  'tags' => ['vegan'],   'desc' => 'Grilled bread rubbed with garlic, topped with fresh tomatoes and basil.'],
                    ['name' => 'Chicken Liver Pâté',             'price' => 480,  'prep' => 5,  'tags' => [],          'desc' => 'Smooth chicken liver pâté with toasted crostini and red onion chutney.'],
                ],
            ],
            [
                'name'        => 'Main Course',
                'description' => 'Hearty mains cooked to order',
                'image_url'   => 'https://placehold.co/400x300/16a34a/ffffff?text=Mains',
                'sort_order'  => 2,
                'items' => [
                    ['name' => 'Grilled Tilapia',               'price' => 1200, 'prep' => 20, 'tags' => ['popular', 'seafood'], 'desc' => 'Whole tilapia grilled with lemon butter, served with ugali and kachumbari.'],
                    ['name' => 'Nyama Choma (500g)',             'price' => 1800, 'prep' => 30, 'tags' => ['popular'],           'desc' => 'Charcoal-grilled goat meat, served with kachumbari and ugali.'],
                    ['name' => 'Chicken Biryani',                'price' => 950,  'prep' => 25, 'tags' => ['popular', 'spicy'],  'desc' => 'Fragrant basmati rice cooked with tender chicken, spices and fried onions.'],
                    ['name' => 'Beef Stew & Chapati',            'price' => 680,  'prep' => 15, 'tags' => [],                   'desc' => 'Slow-cooked beef stew in rich tomato sauce, served with 3 soft chapatis.'],
                    ['name' => 'Grilled Chicken Breast',         'price' => 1050, 'prep' => 20, 'tags' => [],                   'desc' => 'Marinated chicken breast with roasted vegetables and mashed potatoes.'],
                    ['name' => 'Fish & Chips',                   'price' => 950,  'prep' => 18, 'tags' => ['seafood'],          'desc' => 'Beer-battered fish fillet with thick-cut chips and tartare sauce.'],
                    ['name' => 'Vegetable Curry',                'price' => 620,  'prep' => 15, 'tags' => ['vegan', 'spicy'],   'desc' => 'Mixed vegetables in coconut curry sauce, served with basmati rice.'],
                    ['name' => 'T-Bone Steak (300g)',            'price' => 2400, 'prep' => 25, 'tags' => ['premium'],          'desc' => 'Grilled T-bone steak to your liking, with sautéed mushrooms and fries.'],
                ],
            ],
            [
                'name'        => 'Sides & Extras',
                'description' => 'Complete your meal',
                'image_url'   => 'https://placehold.co/400x300/7c3aed/ffffff?text=Sides',
                'sort_order'  => 3,
                'items' => [
                    ['name' => 'Ugali',                'price' => 80,  'prep' => 5,  'tags' => [],          'desc' => 'Kenyan staple maize meal.'],
                    ['name' => 'Steamed Rice',         'price' => 120, 'prep' => 5,  'tags' => ['vegan'],   'desc' => 'Fluffy steamed white rice.'],
                    ['name' => 'Fries',                'price' => 200, 'prep' => 10, 'tags' => ['popular'], 'desc' => 'Crispy golden french fries with tomato sauce.'],
                    ['name' => 'Kachumbari',           'price' => 100, 'prep' => 3,  'tags' => ['vegan'],   'desc' => 'Fresh tomato and onion salad with coriander.'],
                    ['name' => 'Garlic Bread',         'price' => 180, 'prep' => 5,  'tags' => [],          'desc' => 'Toasted baguette with garlic butter.'],
                    ['name' => 'Extra Chapati (2 pcs)','price' => 80,  'prep' => 5,  'tags' => ['vegan'],   'desc' => 'Soft homemade chapati.'],
                ],
            ],
            [
                'name'        => 'Drinks',
                'description' => 'Refreshing beverages',
                'image_url'   => 'https://placehold.co/400x300/0284c7/ffffff?text=Drinks',
                'sort_order'  => 4,
                'items' => [
                    ['name' => 'Fresh Juice (500ml)',        'price' => 250, 'prep' => 3,  'tags' => ['popular', 'vegan'], 'desc' => 'Choice of mango, passion, pineapple or watermelon.'],
                    ['name' => 'Soft Drink (300ml)',         'price' => 120, 'prep' => 1,  'tags' => [],                  'desc' => 'Coke, Fanta, Sprite or Stoney.'],
                    ['name' => 'Mineral Water (500ml)',      'price' => 80,  'prep' => 1,  'tags' => ['vegan'],           'desc' => 'Still or sparkling.'],
                    ['name' => 'Tusker Lager (500ml)',       'price' => 350, 'prep' => 2,  'tags' => [],                  'desc' => 'Kenya\'s favourite cold lager.'],
                    ['name' => 'White Cap Lager (330ml)',    'price' => 280, 'prep' => 2,  'tags' => [],                  'desc' => 'Light and crisp lager.'],
                    ['name' => 'Dawa Cocktail',              'price' => 650, 'prep' => 5,  'tags' => ['popular'],         'desc' => 'Kenyan classic: vodka, lime, honey and crushed ice.'],
                    ['name' => 'Tea / Coffee',               'price' => 150, 'prep' => 5,  'tags' => [],                  'desc' => 'Served with milk and sugar.'],
                ],
            ],
            [
                'name'        => 'Desserts',
                'description' => 'Sweet endings',
                'image_url'   => 'https://placehold.co/400x300/ec4899/ffffff?text=Desserts',
                'sort_order'  => 5,
                'items' => [
                    ['name' => 'Chocolate Lava Cake',       'price' => 580, 'prep' => 12, 'tags' => ['popular'],  'desc' => 'Warm chocolate cake with a molten centre, served with vanilla ice cream.'],
                    ['name' => 'Fruit Salad',               'price' => 320, 'prep' => 5,  'tags' => ['vegan'],    'desc' => 'Seasonal fresh fruits with honey and mint.'],
                    ['name' => 'Cheesecake',                'price' => 480, 'prep' => 5,  'tags' => [],           'desc' => 'New York-style cheesecake with berry compote.'],
                    ['name' => 'Ice Cream (2 scoops)',      'price' => 280, 'prep' => 3,  'tags' => [],           'desc' => 'Choice of vanilla, chocolate or strawberry.'],
                ],
            ],
        ];

        foreach ($menuData as $catData) {
            $category = MenuCategory::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $catData['name']],
                [
                    'tenant_id'   => $tenant->id,
                    'name'        => $catData['name'],
                    'description' => $catData['description'],
                    'image_url'   => $catData['image_url'],
                    'sort_order'  => $catData['sort_order'],
                    'is_active'   => true,
                ]
            );

            foreach ($catData['items'] as $i => $itemData) {
                MenuItem::updateOrCreate(
                    ['tenant_id' => $tenant->id, 'name' => $itemData['name']],
                    [
                        'tenant_id'    => $tenant->id,
                        'category_id'  => $category->id,
                        'name'         => $itemData['name'],
                        'description'  => $itemData['desc'],
                        'image_url'    => null,
                        'base_price'   => $itemData['price'],
                        'unit'         => 'portion',
                        'is_available' => true,
                        'is_active'    => true,
                        'prep_time_min'=> $itemData['prep'],
                        'tags'         => $itemData['tags'],
                        'sort_order'   => $i + 1,
                    ]
                );
            }

            $this->command->info("  ✓ Category: {$catData['name']} ({$this->itemCount($catData['items'])} items)");
        }
    }

    private function itemCount(array $items): int
    {
        return count($items);
    }
}
