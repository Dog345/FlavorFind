-- =============================================================
-- Mamba Hotel — Full Menu Seed Script
-- =============================================================
-- Run this on the hotel PostgreSQL database AFTER you have
-- replaced every PLACEHOLDER_xxx image URL with a real URL.
--
-- Usage:
--   sudo -u postgres psql -d hotel -f seed_menu.sql
--
-- What this script does:
--   1. Deletes all existing menu data (safe — preserves orders)
--   2. Inserts 6 categories
--   3. Inserts 50 menu items
--   4. Inserts upsell / pairing rules
-- =============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 0. Grab the tenant ID once (reused throughout)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE v_tenant UUID := (SELECT id FROM tenants WHERE slug = 'mamba');
BEGIN
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Tenant "mamba" not found. Aborting.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 1. Clear existing menu data (order_items FK prevents order loss)
-- ─────────────────────────────────────────────────────────────
DELETE FROM upsell_rules    WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba');
DELETE FROM upsell_impressions WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba');
DELETE FROM menu_items      WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba');
DELETE FROM menu_categories WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba');

-- ─────────────────────────────────────────────────────────────
-- 2. Categories
-- ─────────────────────────────────────────────────────────────
INSERT INTO menu_categories
  (id, tenant_id, name, description, image_url, sort_order, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'mamba'),
  c.nm, c.dsc, c.img, c.srt, true, NOW(), NOW()
FROM (VALUES
  ('Starters & Soups', 'Light bites and warming soups to open your appetite',    'PLACEHOLDER_starters_category', 1),
  ('Mains',            'Hearty dishes cooked fresh to order',                    'PLACEHOLDER_mains_category',    2),
  ('Pasta & Rice',     'Comforting pasta and fragrant rice dishes',              'PLACEHOLDER_pasta_category',    3),
  ('Sides',            'Perfect accompaniments to your main course',             'PLACEHOLDER_sides_category',    4),
  ('Desserts',         'Sweet endings crafted in our kitchen',                   'PLACEHOLDER_desserts_category', 5),
  ('Drinks',           'Fresh juices, mocktails and hot beverages',              'PLACEHOLDER_drinks_category',   6)
) AS c(nm, dsc, img, srt);

-- ─────────────────────────────────────────────────────────────
-- 3. Menu Items
-- ─────────────────────────────────────────────────────────────

-- Helper: category id shorthand
-- (used inline in each insert below)

-- ── 3a. STARTERS & SOUPS ──────────────────────────────────────
INSERT INTO menu_items
  (id, tenant_id, category_id, name, description, image_url, base_price, unit,
   is_available, is_active, prep_time_min, tags, sort_order, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'mamba'),
  (SELECT id FROM menu_categories WHERE name = 'Starters & Soups'
     AND tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba')),
  i.nm, i.dsc, i.img, i.price, i.unit, true, true, i.prep, i.tags::jsonb, i.srt, NOW(), NOW()
FROM (VALUES
  ('Crispy Calamari',
   'Tender rings of fresh squid lightly dusted in seasoned flour and fried until golden. Served with a zesty lemon aioli and chilli flakes.',
   'PLACEHOLDER_s01_crispy_calamari',    750,  'portion', 15, '["popular","seafood"]',       1),
  ('Beef Broth Soup',
   'Rich slow-simmered beef bone broth with shredded tenderloin, garden vegetables and fresh herbs. Warming and deeply flavourful.',
   'PLACEHOLDER_s02_beef_broth_soup',    600,  'bowl',    10, '["popular"]',                 2),
  ('Bruschetta al Pomodoro',
   'Toasted sourdough rubbed with garlic, topped with ripe diced tomatoes, fresh basil and a drizzle of extra-virgin olive oil.',
   'PLACEHOLDER_s03_bruschetta',         550,  'portion', 10, '["vegetarian","popular"]',    3),
  ('Pumpkin Cream Soup',
   'Velvety roasted pumpkin purée with coconut milk, ginger and a swirl of cream. Served with toasted pumpkin seeds.',
   'PLACEHOLDER_s04_pumpkin_soup',       580,  'bowl',    15, '["vegetarian","popular"]',    4),
  ('Garlic Prawn Skewers',
   'Plump tiger prawns marinated in garlic butter, lemon and smoked paprika. Grilled on skewers and served over dressed greens.',
   'PLACEHOLDER_s05_garlic_prawn_skewers', 950, 'portion', 20, '["popular","seafood","premium"]', 5),
  ('Chicken Liver Pâté',
   'Smooth and rich chicken liver pâté with caramelised onions, a touch of brandy and fresh thyme. Served with toasted ciabatta.',
   'PLACEHOLDER_s06_chicken_liver_pate', 680,  'portion', 10, '[]',                          6),
  ('Tomato Basil Soup',
   'Classic slow-roasted tomato soup blended with fresh basil and a splash of cream. Served with a grilled cheese crouton on top.',
   'PLACEHOLDER_s07_tomato_basil_soup',  520,  'bowl',    10, '["vegetarian"]',               7),
  ('Loaded Potato Skins',
   'Crispy baked potato skins filled with melted cheddar, sour cream and chives. A crowd-pleasing bar-style snack.',
   'PLACEHOLDER_s08_potato_skins',       650,  'portion', 20, '["popular","vegetarian"]',    8)
) AS i(nm, dsc, img, price, unit, prep, tags, srt);

-- ── 3b. MAINS ─────────────────────────────────────────────────
INSERT INTO menu_items
  (id, tenant_id, category_id, name, description, image_url, base_price, unit,
   is_available, is_active, prep_time_min, tags, sort_order, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'mamba'),
  (SELECT id FROM menu_categories WHERE name = 'Mains'
     AND tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba')),
  i.nm, i.dsc, i.img, i.price, i.unit, true, true, i.prep, i.tags::jsonb, i.srt, NOW(), NOW()
FROM (VALUES
  ('Grilled Sirloin Steak',
   '250g prime beef sirloin grilled to your preference, finished with herb butter. Served with roasted garlic and a red wine jus.',
   'PLACEHOLDER_m01_sirloin_steak',      2800, 'portion', 25, '["popular","premium"]',        1),
  ('Herb Roasted Chicken',
   'Half chicken marinated in rosemary, thyme, garlic and lemon. Slow-roasted until golden and juicy, served with pan drippings.',
   'PLACEHOLDER_m02_herb_roasted_chicken', 1600, 'portion', 35, '["popular"]',                2),
  ('Pan-Seared Tilapia',
   'Whole tilapia fillet pan-seared in brown butter with capers and dill. Light, flaky and perfectly seasoned.',
   'PLACEHOLDER_m03_pan_seared_tilapia', 1450, 'portion', 20, '["popular","seafood"]',        3),
  ('Slow-Braised Beef Short Ribs',
   'Beef short ribs braised for 6 hours in red wine and aromatics until fall-off-the-bone tender. Served with creamy mash.',
   'PLACEHOLDER_m04_beef_short_ribs',    2600, 'portion', 15, '["popular","premium"]',        4),
  ('Chicken Tikka Masala',
   'Tender chunks of marinated chicken in a rich, aromatic tomato-cream curry. Served with steamed basmati rice and naan.',
   'PLACEHOLDER_m05_chicken_tikka_masala', 1550, 'portion', 25, '["popular","spicy"]',        5),
  ('Grilled Salmon Fillet',
   'Atlantic salmon fillet grilled over charcoal with lemon-dill butter. Served with sautéed spinach and wedge of lemon.',
   'PLACEHOLDER_m06_grilled_salmon',     2100, 'portion', 20, '["popular","seafood"]',        6),
  ('Lamb Chops with Mint Jus',
   'Three tender lamb loin chops seasoned with cumin and coriander, grilled and finished with a fresh mint and garlic jus.',
   'PLACEHOLDER_m07_lamb_chops',         2400, 'portion', 25, '["premium"]',                  7),
  ('Beef Burger Classic',
   '180g hand-formed beef patty, toasted brioche bun, aged cheddar, lettuce, tomato, pickles and house burger sauce.',
   'PLACEHOLDER_m08_beef_burger',        1350, 'portion', 20, '["popular"]',                  8),
  ('Butter Chicken',
   'Classic Punjabi butter chicken — yoghurt-marinated chicken in a silky tomato-butter-cream sauce. Mild, fragrant and rich.',
   'PLACEHOLDER_m09_butter_chicken',     1500, 'portion', 25, '["popular"]',                  9),
  ('Whole Grilled Snapper',
   'Fresh whole red snapper scored and grilled over open flame with garlic, chilli and lime. Served with a tropical mango salsa.',
   'PLACEHOLDER_m10_grilled_snapper',    2200, 'portion', 30, '["seafood","popular"]',        10),
  ('Vegetable Coconut Curry',
   'Seasonal vegetables — courgette, chickpeas, sweet potato and spinach — simmered in a fragrant coconut and lemongrass curry. Served with rice.',
   'PLACEHOLDER_m11_vegetable_curry',    1200, 'portion', 25, '["vegetarian","vegan","popular"]', 11),
  ('Chicken Schnitzel',
   'Flattened chicken breast coated in crispy panko breadcrumbs, pan-fried golden. Served with creamy mushroom sauce.',
   'PLACEHOLDER_m12_chicken_schnitzel',  1450, 'portion', 20, '["popular"]',                 12)
) AS i(nm, dsc, img, price, unit, prep, tags, srt);

-- ── 3c. PASTA & RICE ──────────────────────────────────────────
INSERT INTO menu_items
  (id, tenant_id, category_id, name, description, image_url, base_price, unit,
   is_available, is_active, prep_time_min, tags, sort_order, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'mamba'),
  (SELECT id FROM menu_categories WHERE name = 'Pasta & Rice'
     AND tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba')),
  i.nm, i.dsc, i.img, i.price, i.unit, true, true, i.prep, i.tags::jsonb, i.srt, NOW(), NOW()
FROM (VALUES
  ('Spaghetti Carbonara',
   'Authentic Roman carbonara — spaghetti tossed with crispy pancetta, egg yolk, Pecorino Romano and black pepper. No cream.',
   'PLACEHOLDER_p01_spaghetti_carbonara', 1100, 'portion', 20, '["popular"]',                 1),
  ('Penne Arrabbiata',
   'Penne pasta in a fierce, spicy tomato and garlic sauce with fresh chilli and basil. Simple, punchy and satisfying.',
   'PLACEHOLDER_p02_penne_arrabbiata',   950,  'portion', 20, '["vegetarian","spicy"]',       2),
  ('Fettuccine Alfredo',
   'Wide ribbon pasta in a luxurious Parmesan cream sauce. Finished with grilled chicken breast and fresh parsley.',
   'PLACEHOLDER_p03_fettuccine_alfredo', 1250, 'portion', 20, '["popular"]',                  3),
  ('Steamed Basmati Rice',
   'Fragrant long-grain basmati rice steamed with a bay leaf and cardamom. Light, fluffy and the perfect base for any curry or stew.',
   'PLACEHOLDER_p04_basmati_rice',       350,  'portion', 15, '["vegetarian","vegan"]',       4),
  ('Chicken Fried Rice',
   'Wok-tossed jasmine rice with diced chicken, egg, spring onions, garlic and soy sauce. Light smoke from the wok, crispy edges.',
   'PLACEHOLDER_p05_chicken_fried_rice', 1050, 'portion', 18, '["popular"]',                  5),
  ('Mushroom Risotto',
   'Arborio rice slow-cooked with mixed wild mushrooms, white wine and Parmesan until creamy and al dente. Finished with truffle oil.',
   'PLACEHOLDER_p06_mushroom_risotto',   1300, 'portion', 30, '["vegetarian","popular"]',     6)
) AS i(nm, dsc, img, price, unit, prep, tags, srt);

-- ── 3d. SIDES ─────────────────────────────────────────────────
INSERT INTO menu_items
  (id, tenant_id, category_id, name, description, image_url, base_price, unit,
   is_available, is_active, prep_time_min, tags, sort_order, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'mamba'),
  (SELECT id FROM menu_categories WHERE name = 'Sides'
     AND tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba')),
  i.nm, i.dsc, i.img, i.price, i.unit, true, true, i.prep, i.tags::jsonb, i.srt, NOW(), NOW()
FROM (VALUES
  ('Hand-Cut Chips',
   'Thick-cut potato chips double-fried for a crispy shell and fluffy centre. Seasoned with sea salt and served with house ketchup.',
   'PLACEHOLDER_si01_hand_cut_chips',    350,  'portion', 15, '["popular","vegan"]',          1),
  ('Creamy Mashed Potato',
   'Yukon Gold potatoes mashed with butter, warm cream and a pinch of nutmeg until silky smooth. Rich and comforting.',
   'PLACEHOLDER_si02_mashed_potato',     380,  'portion', 15, '["popular","vegetarian"]',     2),
  ('Sautéed Garlic Spinach',
   'Fresh baby spinach wilted in a hot pan with garlic, olive oil, sea salt and a squeeze of lemon. Vibrant and nutritious.',
   'PLACEHOLDER_si03_garlic_spinach',    320,  'portion', 10, '["vegetarian","vegan"]',       3),
  ('Roasted Root Vegetables',
   'Seasonal carrots, parsnips and beetroot tossed in olive oil, honey and thyme, roasted until caramelised and tender.',
   'PLACEHOLDER_si04_roasted_vegetables', 380, 'portion', 30, '["vegetarian","vegan"]',       4),
  ('Steamed Broccoli & Tenderstem',
   'Tenderstem broccoli and florets steamed until bright green and just tender. Dressed with a lemon and almond butter.',
   'PLACEHOLDER_si05_broccoli',          350,  'portion', 10, '["vegetarian","vegan"]',       5),
  ('Grilled Corn on the Cob',
   'Sweet corn grilled on open flame until charred, brushed with herb butter and a dusting of chilli powder.',
   'PLACEHOLDER_si06_grilled_corn',      280,  'piece',   10, '["popular","vegetarian"]',     6)
) AS i(nm, dsc, img, price, unit, prep, tags, srt);

-- ── 3e. DESSERTS ──────────────────────────────────────────────
INSERT INTO menu_items
  (id, tenant_id, category_id, name, description, image_url, base_price, unit,
   is_available, is_active, prep_time_min, tags, sort_order, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'mamba'),
  (SELECT id FROM menu_categories WHERE name = 'Desserts'
     AND tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba')),
  i.nm, i.dsc, i.img, i.price, i.unit, true, true, i.prep, i.tags::jsonb, i.srt, NOW(), NOW()
FROM (VALUES
  ('Chocolate Fondant',
   'Warm dark chocolate cake with a molten centre, dusted with icing sugar. Served with a scoop of vanilla bean ice cream.',
   'PLACEHOLDER_de01_chocolate_fondant', 750,  'portion', 15, '["popular","premium"]',        1),
  ('Classic Crème Brûlée',
   'Silky vanilla custard set in a ramekin and finished with a perfectly caramelised sugar crust. Crack and enjoy.',
   'PLACEHOLDER_de02_creme_brulee',      680,  'portion', 10, '["popular"]',                  2),
  ('New York Cheesecake',
   'Dense and creamy baked cheesecake on a buttery digestive biscuit base. Served with a fresh strawberry compote.',
   'PLACEHOLDER_de03_cheesecake',        650,  'slice',    5, '["popular"]',                  3),
  ('Mango Panna Cotta',
   'Light Italian-style panna cotta infused with fresh Kenyan mango. Set in a glass and topped with mango coulis and mint.',
   'PLACEHOLDER_de04_mango_panna_cotta', 600,  'portion',  5, '["popular"]',                  4),
  ('Banana Foster Pancakes',
   'Fluffy buttermilk pancakes topped with caramelised banana in brown sugar rum sauce and a drizzle of cream.',
   'PLACEHOLDER_de05_banana_foster_pancakes', 700, 'portion', 15, '["popular"]',              5),
  ('Tiramisu',
   'Classic Italian tiramisu — espresso-soaked savoiardi layered with mascarpone cream and dusted with fine cocoa powder.',
   'PLACEHOLDER_de06_tiramisu',          720,  'portion',  5, '["popular"]',                  6),
  ('Fruit Salad with Cream',
   'Seasonal fresh fruits — watermelon, pineapple, pawpaw, kiwi and passion fruit — tossed in a honey-lime dressing. Served with whipped cream.',
   'PLACEHOLDER_de07_fruit_salad',       500,  'bowl',     5, '["popular","vegan"]',           7),
  ('Warm Malva Pudding',
   'South African sticky apricot sponge pudding soaked in a warm cream sauce. Served with a side of vanilla custard.',
   'PLACEHOLDER_de08_malva_pudding',     620,  'portion', 15, '["popular"]',                  8)
) AS i(nm, dsc, img, price, unit, prep, tags, srt);

-- ── 3f. DRINKS ────────────────────────────────────────────────
INSERT INTO menu_items
  (id, tenant_id, category_id, name, description, image_url, base_price, unit,
   is_available, is_active, prep_time_min, tags, sort_order, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE slug = 'mamba'),
  (SELECT id FROM menu_categories WHERE name = 'Drinks'
     AND tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba')),
  i.nm, i.dsc, i.img, i.price, i.unit, true, true, i.prep, i.tags::jsonb, i.srt, NOW(), NOW()
FROM (VALUES
  ('Still Water',
   'Chilled still mineral water. Small (500ml) or large (1L) available.',
   'PLACEHOLDER_d01_still_water',        150,  'bottle',   2, '[]',                           1),
  ('Coca-Cola',
   'Ice-cold Coca-Cola served over ice in a tall glass.',
   'PLACEHOLDER_d02_coca_cola',          200,  'glass',    2, '["popular"]',                  2),
  ('Fresh Orange Juice',
   'Freshly squeezed Kenyan oranges, no added sugar. Served chilled.',
   'PLACEHOLDER_d03_orange_juice',       380,  'glass',    5, '["popular"]',                  3),
  ('Mango Passion Smoothie',
   'Blended fresh mango and passion fruit with yoghurt and a touch of honey. Thick, tropical and refreshing.',
   'PLACEHOLDER_d04_mango_smoothie',     450,  'glass',    5, '["popular"]',                  4),
  ('Sparkling Water',
   'Ice-cold carbonated mineral water with a wedge of lemon.',
   'PLACEHOLDER_d05_sparkling_water',    200,  'bottle',   2, '[]',                           5),
  ('Ginger Lemonade',
   'Housemade lemonade with a kick of fresh ginger, mint leaves and a pinch of cayenne. Served over ice.',
   'PLACEHOLDER_d06_ginger_lemonade',    420,  'glass',    5, '["popular"]',                  6),
  ('Hot Coffee',
   'Freshly brewed Kenyan AA coffee. Choose: espresso, Americano, cappuccino or flat white.',
   'PLACEHOLDER_d07_hot_coffee',         350,  'cup',      5, '["popular"]',                  7),
  ('Dessert Wine',
   'A glass of chilled sweet dessert wine. Ask your waiter for today''s selection.',
   'PLACEHOLDER_d08_dessert_wine',       900,  'glass',    2, '["premium"]',                  8),
  ('Masala Chai',
   'Kenyan tea brewed strong with milk, cardamom, ginger, cinnamon and black pepper. The ultimate comfort drink.',
   'PLACEHOLDER_d09_masala_chai',        280,  'cup',      8, '["popular"]',                  9),
  ('Virgin Mojito',
   'Muddled fresh mint and lime with sugar syrup, topped with sparkling water and crushed ice. Bright and refreshing.',
   'PLACEHOLDER_d10_virgin_mojito',      480,  'glass',    5, '["popular"]',                 10)
) AS i(nm, dsc, img, price, unit, prep, tags, srt);

-- ─────────────────────────────────────────────────────────────
-- 4. Upsell / Pairing Rules
--    "When guest selects X, suggest Y"
-- ─────────────────────────────────────────────────────────────
INSERT INTO upsell_rules
  (id, tenant_id, trigger_item_id, suggested_item_id, prompt_text, priority, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  t.tid,
  trg.id,
  sug.id,
  r.prompt,
  r.priority,
  true,
  NOW(), NOW()
FROM (VALUES
  -- Steak → pair with chips, mash, wine
  ('Grilled Sirloin Steak',    'Hand-Cut Chips',          'Add hand-cut chips?',              3),
  ('Grilled Sirloin Steak',    'Creamy Mashed Potato',    'Upgrade with mashed potato?',      2),
  ('Grilled Sirloin Steak',    'Dessert Wine',            'Pair with a dessert wine?',        1),
  ('Grilled Sirloin Steak',    'Still Water',             'Still water with your meal?',      4),
  -- Roast Chicken → sides + drinks
  ('Herb Roasted Chicken',     'Roasted Root Vegetables', 'Add roasted vegetables?',          1),
  ('Herb Roasted Chicken',     'Creamy Mashed Potato',    'Add creamy mash?',                 2),
  ('Herb Roasted Chicken',     'Hot Coffee',              'Finish with a coffee?',            3),
  -- Tilapia → spinach, water, mojito
  ('Pan-Seared Tilapia',       'Sautéed Garlic Spinach',  'Add garlic spinach?',              1),
  ('Pan-Seared Tilapia',       'Virgin Mojito',           'Try our virgin mojito?',           2),
  -- Short Ribs → mash, wine
  ('Slow-Braised Beef Short Ribs', 'Creamy Mashed Potato','Add creamy mash?',                 1),
  ('Slow-Braised Beef Short Ribs', 'Dessert Wine',        'Pair with a dessert wine?',        2),
  -- Tikka Masala → rice, chai
  ('Chicken Tikka Masala',     'Steamed Basmati Rice',    'Add basmati rice?',                1),
  ('Chicken Tikka Masala',     'Masala Chai',             'Finish with masala chai?',         2),
  ('Chicken Tikka Masala',     'Ginger Lemonade',         'Cool down with ginger lemonade?',  3),
  -- Salmon → spinach, sparkling water, mojito
  ('Grilled Salmon Fillet',    'Sautéed Garlic Spinach',  'Add garlic spinach?',              1),
  ('Grilled Salmon Fillet',    'Virgin Mojito',           'Try our virgin mojito?',           2),
  -- Lamb → mash, veg, wine
  ('Lamb Chops with Mint Jus', 'Creamy Mashed Potato',    'Add creamy mash?',                 1),
  ('Lamb Chops with Mint Jus', 'Roasted Root Vegetables', 'Add roasted vegetables?',          2),
  -- Burger → chips, Coke
  ('Beef Burger Classic',      'Hand-Cut Chips',          'Add hand-cut chips?',              1),
  ('Beef Burger Classic',      'Coca-Cola',               'Add a Coca-Cola?',                 2),
  -- Butter Chicken → rice, chai
  ('Butter Chicken',           'Steamed Basmati Rice',    'Add basmati rice?',                1),
  ('Butter Chicken',           'Masala Chai',             'Finish with masala chai?',         2),
  -- Snapper → rice, mojito
  ('Whole Grilled Snapper',    'Steamed Basmati Rice',    'Add basmati rice?',                1),
  ('Whole Grilled Snapper',    'Virgin Mojito',           'Pair with a mojito?',              2),
  -- Veg Curry → rice, chai
  ('Vegetable Coconut Curry',  'Steamed Basmati Rice',    'Add basmati rice?',                1),
  ('Vegetable Coconut Curry',  'Masala Chai',             'Finish with masala chai?',         2),
  -- Schnitzel → chips, OJ
  ('Chicken Schnitzel',        'Hand-Cut Chips',          'Add hand-cut chips?',              1),
  ('Chicken Schnitzel',        'Fresh Orange Juice',      'Add fresh orange juice?',          2),
  -- Carbonara → sparkling water, wine
  ('Spaghetti Carbonara',      'Sparkling Water',         'Add sparkling water?',             1),
  ('Spaghetti Carbonara',      'Dessert Wine',            'Pair with a glass of wine?',       2),
  -- Risotto → sparkling water, wine
  ('Mushroom Risotto',         'Sparkling Water',         'Add sparkling water?',             1),
  ('Mushroom Risotto',         'Dessert Wine',            'Pair with a glass of wine?',       2),
  -- Fried Rice → Coke, OJ
  ('Chicken Fried Rice',       'Coca-Cola',               'Add a Coca-Cola?',                 1),
  ('Chicken Fried Rice',       'Fresh Orange Juice',      'Add fresh orange juice?',          2),
  -- Fondant → wine, coffee
  ('Chocolate Fondant',        'Dessert Wine',            'Pair with a dessert wine?',        1),
  ('Chocolate Fondant',        'Hot Coffee',              'Add a coffee?',                    2),
  -- Crème Brûlée → wine, coffee
  ('Classic Crème Brûlée',     'Dessert Wine',            'Pair with a dessert wine?',        1),
  ('Classic Crème Brûlée',     'Hot Coffee',              'Add a coffee?',                    2),
  -- Cheesecake → coffee, OJ
  ('New York Cheesecake',      'Hot Coffee',              'Add a coffee?',                    1),
  ('New York Cheesecake',      'Fresh Orange Juice',      'Add fresh orange juice?',          2),
  -- Tiramisu → coffee, wine
  ('Tiramisu',                 'Hot Coffee',              'Add a coffee?',                    1),
  ('Tiramisu',                 'Dessert Wine',            'Pair with a dessert wine?',        2),
  -- Malva Pudding → chai, coffee
  ('Warm Malva Pudding',       'Masala Chai',             'Finish with masala chai?',         1),
  ('Warm Malva Pudding',       'Hot Coffee',              'Add a coffee?',                    2),
  -- Prawn Skewers → mojito, lemonade
  ('Garlic Prawn Skewers',     'Virgin Mojito',           'Pair with a virgin mojito?',       1),
  ('Garlic Prawn Skewers',     'Ginger Lemonade',         'Add ginger lemonade?',             2),
  -- Calamari → lemonade, mojito
  ('Crispy Calamari',          'Ginger Lemonade',         'Add ginger lemonade?',             1),
  ('Crispy Calamari',          'Virgin Mojito',           'Pair with a mojito?',              2),
  -- Potato skins → Coke, lemonade
  ('Loaded Potato Skins',      'Coca-Cola',               'Add a Coca-Cola?',                 1),
  ('Loaded Potato Skins',      'Ginger Lemonade',         'Add ginger lemonade?',             2)
) AS r(trigger_nm, suggest_nm, prompt, priority)
CROSS JOIN (SELECT id AS tid FROM tenants WHERE slug = 'mamba') t
JOIN menu_items trg ON trg.name = r.trigger_nm  AND trg.tenant_id = t.tid
JOIN menu_items sug ON sug.name = r.suggest_nm  AND sug.tenant_id = t.tid
ON CONFLICT (tenant_id, trigger_item_id, suggested_item_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. Verification
-- ─────────────────────────────────────────────────────────────
SELECT
  mc.name       AS category,
  COUNT(mi.id)  AS items
FROM menu_categories mc
LEFT JOIN menu_items mi ON mi.category_id = mc.id
WHERE mc.tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba')
GROUP BY mc.name, mc.sort_order
ORDER BY mc.sort_order;

SELECT COUNT(*) AS total_upsell_rules
FROM upsell_rules
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mamba');

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- DONE.
-- Next step: replace all PLACEHOLDER_xxx image URLs with real
-- Midjourney image URLs, then re-run this script.
-- See image_url_guide.md for instructions.
-- ─────────────────────────────────────────────────────────────
