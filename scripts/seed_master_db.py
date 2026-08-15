#!/usr/bin/env python3
"""
FlavorFind Master DB Seeder — 50k batch
========================================
Seeds 50,000 recipes from recipes.csv into Supabase.
Run multiple times with --offset to seed in chunks.

Usage:
  python3 scripts/seed_master_db.py              # seeds first 50k
  python3 scripts/seed_master_db.py 50000        # seeds next 50k (offset=50000)
  python3 scripts/seed_master_db.py 100000       # seeds next 50k
"""

import csv, re, sys, uuid, time, html, json
from datetime import datetime
import psycopg2, psycopg2.extras

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_HOST     = "REDACTED_HOST"
DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_USER     = "flavorfind"
DB_PASSWORD = "REDACTED_PASSWORD"
DB_SSLMODE  = "prefer"

CSV_PATH    = "/home/m/Documents/GitHub/FlavorFind/archive (3)/recipes.csv"
BATCH_SIZE  = 200    # rows per INSERT
CHUNK_SIZE  = 50000  # recipes per run
OFFSET      = int(sys.argv[1]) if len(sys.argv) > 1 else 0

# ─── ALLERGEN MAP ─────────────────────────────────────────────────────────────
ALLERGEN_MAP = {
    'gluten':    ['flour','wheat','bread','pasta','noodle','barley','rye',
                  'semolina','spelt','couscous','cracker','tortilla','biscuit',
                  'pancake','wafer','cereal','oat','panko','breadcrumb'],
    'dairy':     ['milk','cheese','butter','cream','yogurt','yoghurt','cheddar',
                  'mozzarella','parmesan','brie','ricotta','ghee','whey',
                  'lactose','half-and-half','sour cream','ice cream'],
    'eggs':      ['egg','eggs','mayonnaise','mayo','meringue','custard'],
    'nuts':      ['almond','walnut','pecan','cashew','pistachio','hazelnut',
                  'macadamia','pine nut','chestnut','nut butter','marzipan'],
    'peanuts':   ['peanut','groundnut','peanut butter'],
    'shellfish': ['shrimp','prawn','crab','lobster','crayfish','scallop',
                  'clam','oyster','mussel','squid','octopus'],
    'fish':      ['salmon','tuna','cod','tilapia','halibut','sardine',
                  'anchovy','trout','bass','catfish','mahi','snapper',
                  'fish sauce','worcestershire'],
    'soy':       ['soy','tofu','tempeh','edamame','miso','tamari',
                  'soy sauce','soybean'],
}

CATEGORY_KEYWORDS = {
    'protein':    ['chicken','beef','pork','lamb','fish','salmon','tuna',
                   'shrimp','prawn','egg','tofu','turkey','duck','veal',
                   'goat','meat','steak','bacon','sausage'],
    'vegetable':  ['onion','garlic','tomato','pepper','carrot','spinach',
                   'broccoli','cauliflower','cabbage','kale','lettuce',
                   'cucumber','zucchini','eggplant','mushroom','celery',
                   'leek','asparagus','pumpkin','squash','corn','pea',
                   'bean','lentil','chickpea'],
    'fruit':      ['apple','banana','lemon','lime','orange','mango',
                   'pineapple','strawberry','blueberry','raspberry',
                   'cherry','peach','pear','grape','avocado','coconut'],
    'grain':      ['flour','rice','pasta','bread','oat','wheat','barley',
                   'quinoa','couscous','noodle','tortilla','cornmeal',
                   'semolina','breadcrumb','cracker','cereal'],
    'dairy':      ['milk','cheese','butter','cream','yogurt','yoghurt',
                   'ghee','cheddar','mozzarella','parmesan'],
    'spice':      ['salt','pepper','cumin','coriander','turmeric','paprika',
                   'cinnamon','ginger','chili','chilli','cayenne','oregano',
                   'thyme','rosemary','basil','cardamom','clove','nutmeg',
                   'saffron','vanilla','mint'],
    'condiment':  ['oil','vinegar','sauce','ketchup','mustard','honey',
                   'syrup','jam','paste','stock','broth','soy sauce',
                   'hot sauce','mayo','dressing'],
    'beverage':   ['water','juice','wine','beer','coffee','tea','vodka',
                   'rum','whiskey','gin','brandy','liqueur'],
    'nuts_seeds': ['almond','walnut','pecan','cashew','pistachio','peanut',
                   'sesame','sunflower seed','flaxseed','chia'],
}

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def ts():
    return datetime.now().strftime('%H:%M:%S')

def parse_r_vector(raw):
    if not raw or raw.strip() in ('NA','character(0)',''):
        return []
    items = re.findall(r'"([^"]*)"', raw)
    if items:
        return [i for i in items if i and i != 'NA']
    s = raw.strip()
    return [s] if s and s != 'NA' else []

def normalize_ingredient(raw):
    name = html.unescape(raw.strip().lower())
    name = re.sub(r'&[a-z]+;|&#\d+;', '', name)
    name = re.sub(r'^\d+[\-\s]*(inch|cm|oz|lb|g|ml|liter)\s+', '', name)
    name = re.sub(r'^\d+%\s+', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    if len(name) < 2 or len(name) > 120:
        return None
    if re.match(r'^\d+[\.\d]*$', name) or '?' in name:
        return None
    return name

def detect_allergens(name):
    n = name.lower()
    return [a for a, kws in ALLERGEN_MAP.items() if any(k in n for k in kws)]

def guess_category(name):
    n = name.lower()
    for cat, kws in CATEGORY_KEYWORDS.items():
        if any(k in n for k in kws):
            return cat
    return 'other'

def parse_quantity(s):
    if not s or s == 'NA':
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
            result = round(float(s), 3)
        # Cap to fit DECIMAL(8,3) — max 99999.999
        return result if 0 <= result <= 99999.0 else None
    except:
        return None

def safe_num(val, max_val=99999.0):
    """Parse a numeric string, return None if missing or out of range."""
    if not val or str(val).strip() in ('NA',''):
        return None
    try:
        f = round(float(str(val).strip()), 2)
        return f if 0 <= f <= max_val else None
    except:
        return None

def safe_int(val):
    if not val or str(val).strip() in ('NA',''):
        return None
    try:
        return int(float(str(val).strip()))
    except:
        return None

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    print(f"[{ts()}] Connecting to Supabase...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    conn.autocommit = False
    cur = conn.cursor()
    print(f"[{ts()}] Connected. OFFSET={OFFSET:,}  CHUNK={CHUNK_SIZE:,}\n")

    now_ts = datetime.now()

    # ── PHASE 1: ingredients (only needed on first run) ───────────────────────
    cur.execute("SELECT COUNT(*) FROM master_ingredients")
    ingr_count = cur.fetchone()[0]

    ingredient_map = {}   # normalized_name → uuid

    if ingr_count == 0:
        print(f"[{ts()}] PHASE 1 — Scanning ingredients from full CSV...")
        with open(CSV_PATH, encoding='utf-8', errors='ignore') as f:
            for i, row in enumerate(csv.DictReader(f)):
                for raw in parse_r_vector(row.get('RecipeIngredientParts','')):
                    name = normalize_ingredient(raw)
                    if name and name not in ingredient_map:
                        ingredient_map[name] = str(uuid.uuid4())
                if i % 100000 == 0 and i > 0:
                    print(f"  scanned {i:,} rows, {len(ingredient_map):,} ingredients...")

        print(f"[{ts()}] Inserting {len(ingredient_map):,} ingredients...")
        rows = []
        for name, uid in ingredient_map.items():
            allergens = detect_allergens(name)
            rows.append((
                uid, name, guess_category(name),
                '{' + ','.join(allergens) + '}' if allergens else '{}',
                None, now_ts, now_ts
            ))
        for i in range(0, len(rows), BATCH_SIZE):
            psycopg2.extras.execute_values(cur,
                """INSERT INTO master_ingredients
                   (id, name, category, allergen_flags, description, created_at, updated_at)
                   VALUES %s ON CONFLICT DO NOTHING""",
                rows[i:i+BATCH_SIZE])
            conn.commit()
        print(f"[{ts()}] ✓ {len(rows):,} ingredients seeded\n")
    else:
        print(f"[{ts()}] PHASE 1 — Loading {ingr_count:,} existing ingredients from DB...")
        cur.execute("SELECT name, id FROM master_ingredients")
        for name, uid in cur.fetchall():
            ingredient_map[name] = str(uid)
        print(f"[{ts()}] ✓ Loaded {len(ingredient_map):,} ingredients\n")

    # ── PHASE 2: recipes ──────────────────────────────────────────────────────
    print(f"[{ts()}] PHASE 2 — Inserting recipes {OFFSET:,} → {OFFSET+CHUNK_SIZE:,}...")

    recipe_batch, image_batch, ri_batch = [], [], []
    total_r = total_i = total_ri = skipped = 0

    with open(CSV_PATH, encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)

        for row_num, row in enumerate(reader):
            # Skip rows before offset
            if row_num < OFFSET:
                continue
            # Stop after chunk
            if row_num >= OFFSET + CHUNK_SIZE:
                break

            source_id = safe_int(row.get('RecipeId',''))
            name = row.get('Name','').strip()
            if not source_id or not name:
                skipped += 1
                continue

            recipe_id = str(uuid.uuid4())
            instructions = parse_r_vector(row.get('RecipeInstructions',''))
            keywords     = parse_r_vector(row.get('Keywords',''))
            images       = parse_r_vector(row.get('Images',''))
            ingredients  = parse_r_vector(row.get('RecipeIngredientParts',''))
            quantities   = parse_r_vector(row.get('RecipeIngredientQuantities',''))

            recipe_batch.append((
                recipe_id,
                source_id,
                name,
                row.get('RecipeCategory','').strip() or None,
                (row.get('Description','').strip() or None),
                row.get('CookTime','').strip() or None,
                row.get('PrepTime','').strip() or None,
                row.get('TotalTime','').strip() or None,
                safe_int(row.get('RecipeServings','')),
                row.get('RecipeYield','').strip() or None,
                json.dumps(instructions),
                json.dumps(keywords),
                safe_num(row.get('Calories','')),
                safe_num(row.get('ProteinContent','')),
                safe_num(row.get('FatContent','')),
                safe_num(row.get('CarbohydrateContent','')),
                safe_num(row.get('FiberContent','')),
                safe_num(row.get('SugarContent','')),
                safe_num(row.get('CholesterolContent','')),
                safe_num(row.get('SodiumContent','')),
                safe_num(row.get('SaturatedFatContent','')),
                safe_num(row.get('AggregatedRating',''), max_val=5.0),
                safe_int(row.get('ReviewCount','')) or 0,
                now_ts, now_ts,
            ))

            for j, url in enumerate(images):
                if url and url.startswith('http'):
                    image_batch.append((str(uuid.uuid4()), recipe_id, url, j))
                    total_i += 1

            for j, raw_ingr in enumerate(ingredients):
                norm = normalize_ingredient(raw_ingr)
                if not norm:
                    continue
                ingr_id = ingredient_map.get(norm)
                if not ingr_id:
                    continue
                qty_str = quantities[j] if j < len(quantities) else None
                ri_batch.append((
                    str(uuid.uuid4()), recipe_id, ingr_id,
                    qty_str, parse_quantity(qty_str), j
                ))
                total_ri += 1

            total_r += 1

            if len(recipe_batch) >= BATCH_SIZE:
                flush(cur, conn, recipe_batch, image_batch, ri_batch)
                recipe_batch.clear(); image_batch.clear(); ri_batch.clear()

            if total_r % 5000 == 0:
                print(f"  [{ts()}] {total_r:,} recipes | {total_i:,} images | {total_ri:,} ingredient links")

    if recipe_batch:
        flush(cur, conn, recipe_batch, image_batch, ri_batch)

    print(f"\n[{ts()}] ✅ DONE")
    print(f"  Recipes inserted:       {total_r:,}")
    print(f"  Images inserted:        {total_i:,}")
    print(f"  Ingredient links:       {total_ri:,}")
    print(f"  Skipped (bad rows):     {skipped:,}")
    if OFFSET + CHUNK_SIZE < 522517:
        print(f"\n  Next batch command:")
        print(f"  python3 scripts/seed_master_db.py {OFFSET + CHUNK_SIZE}")

    cur.close()
    conn.close()


def flush(cur, conn, recipes, images, ri):
    psycopg2.extras.execute_values(cur,
        """INSERT INTO recipes
           (id, source_id, name, category, description,
            cook_time, prep_time, total_time, servings, yield,
            instructions, keywords,
            calories, protein_g, fat_g, carbs_g, fiber_g, sugar_g,
            cholesterol_mg, sodium_mg, saturated_fat_g,
            rating, review_count, created_at, updated_at)
           VALUES %s ON CONFLICT (source_id) DO NOTHING""",
        recipes, page_size=BATCH_SIZE)
    if images:
        psycopg2.extras.execute_values(cur,
            "INSERT INTO recipe_images (id, recipe_id, url, sort_order) VALUES %s ON CONFLICT DO NOTHING",
            images, page_size=BATCH_SIZE)
    if ri:
        psycopg2.extras.execute_values(cur,
            """INSERT INTO recipe_ingredients
               (id, recipe_id, ingredient_id, quantity, quantity_numeric, sort_order)
               VALUES %s ON CONFLICT DO NOTHING""",
            ri, page_size=BATCH_SIZE)
    conn.commit()


if __name__ == '__main__':
    t = time.time()
    main()
    print(f"\nTotal time: {(time.time()-t)/60:.1f} min")
