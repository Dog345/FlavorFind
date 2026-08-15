#!/usr/bin/env python3
"""
FlavorFind African Recipes Seeder
===================================
Seeds African recipe CSV files into the master DB.
Handles all CSV files in the data/ directory matching *_recipes.csv
(except the main Food.com data which is handled by seed_master_db.py)

Usage:
  python3 scripts/seed_african_recipes.py                    # seeds all CSV files in data/
  python3 scripts/seed_african_recipes.py data/kenya_recipes.csv   # seeds one file

Tables populated:
  1. master_ingredients  — new ingredients not already in DB
  2. recipes             — African recipes with source_id starting at 9000000+
  3. recipe_ingredients  — join table
  4. recipe_images       — none for African recipes (no image URLs in CSV)
"""

import csv, sys, os, uuid, json, time, re
from datetime import datetime
import psycopg2, psycopg2.extras

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_HOST     = "REDACTED_HOST"
DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_USER     = "flavorfind"
DB_PASSWORD = "REDACTED_PASSWORD"
DB_SSLMODE  = "prefer"

BATCH_SIZE  = 200
DATA_DIR    = "/home/m/Documents/GitHub/FlavorFind/data"

# African recipes get source_ids starting here to avoid collision with Food.com IDs
AFRICAN_SOURCE_ID_START = 9_000_000

# ─── ALLERGEN MAP (same as main seeder) ───────────────────────────────────────
ALLERGEN_MAP = {
    'gluten':    ['flour','wheat','bread','pasta','noodle','barley','rye','chapati','mandazi','injera'],
    'dairy':     ['milk','cheese','butter','cream','yogurt','yoghurt','ghee','cheddar','mozzarella'],
    'eggs':      ['egg','eggs','mayonnaise','mayo'],
    'nuts':      ['almond','walnut','pecan','cashew','pistachio','hazelnut','macadamia'],
    'peanuts':   ['peanut','groundnut','peanut butter','groundnut paste'],
    'shellfish': ['shrimp','prawn','crab','lobster','scallop','clam','oyster','mussel'],
    'fish':      ['salmon','tuna','cod','tilapia','halibut','sardine','anchovy','trout',
                  'fish sauce','dagaa','omena','nile perch','samaki'],
    'soy':       ['soy','tofu','tempeh','edamame','miso','tamari','soy sauce'],
}

CATEGORY_KEYWORDS = {
    'protein':    ['chicken','beef','pork','lamb','goat','fish','shrimp','prawn','egg',
                   'tofu','turkey','duck','meat','steak','bacon','sausage','mutura'],
    'vegetable':  ['onion','garlic','tomato','pepper','carrot','spinach','kale','sukuma',
                   'broccoli','cabbage','mushroom','okra','plantain','cassava','pumpkin',
                   'sweet potato','amaranth','cowpea','bamboo'],
    'fruit':      ['banana','mango','pineapple','passion','avocado','coconut','papaya',
                   'lemon','lime','orange','tamarind'],
    'grain':      ['flour','rice','maize','ugali','posho','millet','sorghum','teff',
                   'cassava flour','wheat','semolina','breadcrumb'],
    'dairy':      ['milk','cheese','butter','cream','yogurt','ghee'],
    'spice':      ['salt','pepper','cumin','coriander','turmeric','paprika','cinnamon',
                   'ginger','chili','chilli','cardamom','clove','berbere','pilau masala'],
    'condiment':  ['oil','vinegar','sauce','honey','syrup','paste','stock','broth',
                   'coconut milk','peanut butter','groundnut paste','tomato paste'],
    'beverage':   ['water','juice','tea','coffee','milk','hibiscus','tamarind juice'],
}

def ts():
    return datetime.now().strftime('%H:%M:%S')

def detect_allergens(name):
    n = name.lower()
    return [a for a, kws in ALLERGEN_MAP.items() if any(k in n for k in kws)]

def guess_category(name):
    n = name.lower()
    for cat, kws in CATEGORY_KEYWORDS.items():
        if any(k in n for k in kws):
            return cat
    return 'other'

def normalize_ingredient(raw):
    name = raw.strip().lower()
    name = re.sub(r'\s+', ' ', name).strip()
    if len(name) < 2 or len(name) > 120:
        return None
    return name

def parse_quantity(s):
    if not s or s in ('NA', 'forfrying', 'asneeded', 'to taste', 'as needed'):
        return None
    s = s.strip()
    try:
        parts = s.split()
        if len(parts) == 2 and '/' in parts[1]:
            n, d = parts[1].split('/')
            result = round(float(parts[0]) + float(n)/float(d), 3)
        elif '/' in s:
            n, d = s.split('/')
            result = round(float(n)/float(d), 3)
        else:
            result = round(float(re.sub(r'[^0-9.]', '', s)), 3)
        return result if 0 < result <= 99999.0 else None
    except:
        return None

def find_csv_files():
    """Find all African recipe CSV files in data/ dir."""
    skip = {'african_recipes.csv', 'deepseek_african_recipes.csv'}  # already merged
    files = []
    for f in os.listdir(DATA_DIR):
        if f.endswith('_recipes.csv') and f not in skip:
            files.append(os.path.join(DATA_DIR, f))
    # Also include our existing files
    for f in ['african_recipes.csv', 'deepseek_african_recipes.csv']:
        path = os.path.join(DATA_DIR, f)
        if os.path.exists(path):
            files.append(path)
    return sorted(files)

def main():
    # Get files to process
    if len(sys.argv) > 1:
        files = sys.argv[1:]
    else:
        files = find_csv_files()

    if not files:
        print("No CSV files found in data/ directory.")
        return

    print(f"[{ts()}] Files to seed:")
    for f in files:
        print(f"  {f}")

    print(f"\n[{ts()}] Connecting to DigitalOcean DB...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    conn.autocommit = False
    cur = conn.cursor()
    print(f"[{ts()}] Connected.\n")

    now_ts = datetime.now()

    # ── Load existing ingredients ─────────────────────────────────────────────
    print(f"[{ts()}] Loading existing ingredients from DB...")
    cur.execute("SELECT name, id FROM master_ingredients")
    ingredient_map = {name: str(uid) for name, uid in cur.fetchall()}
    print(f"[{ts()}] Loaded {len(ingredient_map):,} existing ingredients\n")

    # ── Get current max source_id for African recipes ─────────────────────────
    cur.execute("SELECT MAX(source_id) FROM recipes WHERE source_id >= %s", (AFRICAN_SOURCE_ID_START,))
    row = cur.fetchone()
    next_source_id = (row[0] + 1) if row[0] else AFRICAN_SOURCE_ID_START
    print(f"[{ts()}] Next African source_id: {next_source_id:,}\n")

    total_recipes = total_ingredients_added = total_ri = skipped = 0

    for filepath in files:
        filename = os.path.basename(filepath)
        print(f"[{ts()}] Processing {filename}...")

        new_ingredients = {}
        recipe_batch, ri_batch = [], []
        file_recipes = 0

        with open(filepath, encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)

            for row in reader:
                name = row.get('name', '').strip()
                if not name:
                    skipped += 1
                    continue

                recipe_id = str(uuid.uuid4())
                source_id = next_source_id
                next_source_id += 1

                # Parse pipe-separated fields
                instructions = [s.strip() for s in row.get('instructions', '').split('|') if s.strip()]
                keywords     = [s.strip() for s in row.get('keywords', '').split('|') if s.strip()]
                ingredients  = [s.strip() for s in row.get('ingredients', '').split('|') if s.strip()]
                quantities   = [s.strip() for s in row.get('quantities', '').split('|')]

                def safe_num(val, max_val=99999.0):
                    try:
                        f = round(float(str(val).strip()), 2)
                        return f if 0 <= f <= max_val else None
                    except:
                        return None

                def safe_int(val):
                    try:
                        return int(float(str(val).strip()))
                    except:
                        return None

                recipe_batch.append((
                    recipe_id, source_id, name,
                    row.get('category', '').strip() or None,
                    row.get('description', '').strip() or None,
                    row.get('cook_time', '').strip() or None,
                    row.get('prep_time', '').strip() or None,
                    row.get('total_time', '').strip() or None,
                    safe_int(row.get('servings', '')),
                    None,  # yield
                    json.dumps(instructions),
                    json.dumps(keywords),
                    safe_num(row.get('calories', '')),
                    safe_num(row.get('protein_g', '')),
                    safe_num(row.get('fat_g', '')),
                    safe_num(row.get('carbs_g', '')),
                    safe_num(row.get('fiber_g', '')),
                    safe_num(row.get('sugar_g', '')),
                    safe_num(row.get('cholesterol_mg', '')),
                    safe_num(row.get('sodium_mg', '')),
                    None,  # saturated_fat_g
                    safe_num(row.get('rating', ''), max_val=5.0),
                    safe_int(row.get('review_count', '')) or 0,
                    now_ts, now_ts,
                ))

                # Handle ingredients
                for j, raw_ingr in enumerate(ingredients):
                    norm = normalize_ingredient(raw_ingr)
                    if not norm:
                        continue

                    # Add to DB if new
                    if norm not in ingredient_map and norm not in new_ingredients:
                        new_id = str(uuid.uuid4())
                        new_ingredients[norm] = new_id

                    ingr_id = ingredient_map.get(norm) or new_ingredients.get(norm)
                    if not ingr_id:
                        continue

                    qty_str = quantities[j] if j < len(quantities) else None
                    ri_batch.append((
                        str(uuid.uuid4()), recipe_id, ingr_id,
                        qty_str, parse_quantity(qty_str), j
                    ))
                    total_ri += 1

                file_recipes += 1
                total_recipes += 1

        # Insert new ingredients first
        if new_ingredients:
            ingr_rows = []
            for iname, iid in new_ingredients.items():
                allergens = detect_allergens(iname)
                ingr_rows.append((
                    iid, iname, guess_category(iname),
                    '{' + ','.join(allergens) + '}' if allergens else '{}',
                    None, now_ts, now_ts
                ))
            for i in range(0, len(ingr_rows), BATCH_SIZE):
                psycopg2.extras.execute_values(cur,
                    """INSERT INTO master_ingredients
                       (id, name, category, allergen_flags, description, created_at, updated_at)
                       VALUES %s ON CONFLICT DO NOTHING""",
                    ingr_rows[i:i+BATCH_SIZE])
            conn.commit()
            ingredient_map.update(new_ingredients)
            total_ingredients_added += len(new_ingredients)
            print(f"  Added {len(new_ingredients)} new ingredients")

        # Insert recipes
        for i in range(0, len(recipe_batch), BATCH_SIZE):
            psycopg2.extras.execute_values(cur,
                """INSERT INTO recipes
                   (id, source_id, name, category, description,
                    cook_time, prep_time, total_time, servings, yield,
                    instructions, keywords,
                    calories, protein_g, fat_g, carbs_g, fiber_g, sugar_g,
                    cholesterol_mg, sodium_mg, saturated_fat_g,
                    rating, review_count, created_at, updated_at)
                   VALUES %s ON CONFLICT (source_id) DO NOTHING""",
                recipe_batch[i:i+BATCH_SIZE])
        conn.commit()

        # Insert recipe_ingredients
        for i in range(0, len(ri_batch), BATCH_SIZE):
            psycopg2.extras.execute_values(cur,
                """INSERT INTO recipe_ingredients
                   (id, recipe_id, ingredient_id, quantity, quantity_numeric, sort_order)
                   VALUES %s ON CONFLICT DO NOTHING""",
                ri_batch[i:i+BATCH_SIZE])
        conn.commit()

        print(f"  ✓ {file_recipes} recipes seeded from {filename}")

    print(f"\n[{ts()}] ✅ ALL DONE")
    print(f"  Total African recipes seeded: {total_recipes:,}")
    print(f"  New ingredients added:        {total_ingredients_added:,}")
    print(f"  Ingredient links created:     {total_ri:,}")
    print(f"  Skipped (bad rows):           {skipped:,}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    t = time.time()
    main()
    print(f"\nTotal time: {(time.time()-t)/60:.1f} min")
