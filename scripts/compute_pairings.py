#!/usr/bin/env python3
"""
FlavorFind Ingredient Pairing Engine — Co-occurrence Computation
================================================================
Scans all 4M recipe_ingredients rows and builds a co-occurrence matrix.

For every pair of ingredients (A, B) that appear together in a recipe:
  - increment co_occurrence_count for (A→B) and (B→A)

Then normalise:
  score(A→B) = co_occurrence(A,B) / total_recipes_containing_A

The result tells us: "Given ingredient A, how likely is ingredient B
to also be in the same recipe?"

This runs ONCE and populates ingredient_pairings.
Re-run whenever recipes are added in bulk.

Usage:
  python3 scripts/compute_pairings.py

Runtime estimate: ~10–20 minutes for 4M rows
"""

import psycopg2
import psycopg2.extras
import uuid
import time
from datetime import datetime
from collections import defaultdict

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_HOST     = "134.209.20.131"
DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_USER     = "flavorfind"
DB_PASSWORD = "Ff@Master2026!"
DB_SSLMODE  = "prefer"

BATCH_SIZE       = 1000   # insert batch size
MIN_CO_OCCUR     = 5      # ignore pairs that appear together fewer than 5 times
                          # keeps the table lean and removes noise
TOP_N_PER_INGR   = 50     # store only top 50 pairings per ingredient
                          # 7,273 ingredients × 50 = ~363k rows max

def ts():
    return datetime.now().strftime('%H:%M:%S')

def main():
    print(f"[{ts()}] Connecting...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    conn.autocommit = False
    cur = conn.cursor()
    print(f"[{ts()}] Connected.\n")

    # ── Step 1: Load ingredient categories ───────────────────────────────────
    print(f"[{ts()}] Loading ingredient categories...")
    cur.execute("SELECT id, category FROM master_ingredients")
    ingredient_categories = {str(row[0]): row[1] for row in cur.fetchall()}
    print(f"[{ts()}] Loaded {len(ingredient_categories):,} ingredients\n")

    # ── Step 2: Load recipe→ingredients mapping ───────────────────────────────
    # We need: for each recipe, the list of ingredient_ids
    # Load in chunks to avoid memory issues with 4M rows

    print(f"[{ts()}] Loading recipe-ingredient data in chunks...")

    # co_occur[A][B] = number of recipes containing both A and B
    co_occur = defaultdict(lambda: defaultdict(int))
    # ingredient_recipe_count[A] = number of recipes containing A
    ingredient_recipe_count = defaultdict(int)

    cur.execute("SELECT COUNT(*) FROM recipe_ingredients")
    total_ri = cur.fetchone()[0]
    print(f"[{ts()}] Total recipe_ingredient rows: {total_ri:,}")

    # Process recipe by recipe using a server-side cursor (memory efficient)
    cur2 = conn.cursor('recipe_cursor', cursor_factory=psycopg2.extras.DictCursor)
    cur2.execute("""
        SELECT recipe_id, array_agg(ingredient_id::text) AS ingredients
        FROM recipe_ingredients
        GROUP BY recipe_id
    """)

    processed = 0
    skipped_single = 0

    while True:
        rows = cur2.fetchmany(5000)
        if not rows:
            break

        for row in rows:
            ingr_list = row['ingredients']

            if len(ingr_list) < 2:
                skipped_single += 1
                continue

            # Count each ingredient's recipe appearances
            for ingr in ingr_list:
                ingredient_recipe_count[ingr] += 1

            # Count co-occurrences for every pair in this recipe
            # Use only unique ingredients per recipe
            unique_ingrs = list(set(ingr_list))
            for i in range(len(unique_ingrs)):
                for j in range(i + 1, len(unique_ingrs)):
                    a = unique_ingrs[i]
                    b = unique_ingrs[j]
                    co_occur[a][b] += 1
                    co_occur[b][a] += 1

        processed += len(rows)
        if processed % 50000 == 0:
            print(f"  [{ts()}] Processed {processed:,} recipes...")

    cur2.close()
    print(f"[{ts()}] Done processing. {processed:,} recipes, {skipped_single:,} single-ingredient recipes skipped.")
    print(f"[{ts()}] Unique ingredients seen: {len(co_occur):,}\n")

    # ── Step 3: Build pairing rows ────────────────────────────────────────────
    print(f"[{ts()}] Building pairing rows (min co-occurrence: {MIN_CO_OCCUR}, top {TOP_N_PER_INGR} per ingredient)...")

    now_ts = datetime.now()
    pairing_rows = []
    total_pairs = 0
    low_count_skipped = 0

    for ingr_id, paired_dict in co_occur.items():
        anchor_count = ingredient_recipe_count.get(ingr_id, 1)

        # Sort by co-occurrence descending, take top N
        top_pairs = sorted(paired_dict.items(), key=lambda x: -x[1])[:TOP_N_PER_INGR]

        for paired_id, count in top_pairs:
            if count < MIN_CO_OCCUR:
                low_count_skipped += 1
                continue

            score = round(count / anchor_count, 5)
            paired_category = ingredient_categories.get(paired_id)

            pairing_rows.append((
                str(uuid.uuid4()),
                ingr_id,
                paired_id,
                count,
                score,
                paired_category,
                now_ts,
                now_ts,
            ))
            total_pairs += 1

    print(f"[{ts()}] Generated {total_pairs:,} pairing rows ({low_count_skipped:,} below min threshold)\n")

    # ── Step 4: Clear old pairings and insert new ─────────────────────────────
    print(f"[{ts()}] Clearing old pairings...")
    cur.execute("TRUNCATE ingredient_pairings")
    conn.commit()

    print(f"[{ts()}] Inserting {total_pairs:,} pairing rows in batches of {BATCH_SIZE}...")
    inserted = 0
    for i in range(0, len(pairing_rows), BATCH_SIZE):
        batch = pairing_rows[i:i + BATCH_SIZE]
        psycopg2.extras.execute_values(cur,
            """INSERT INTO ingredient_pairings
               (id, ingredient_id, paired_ingredient_id,
                co_occurrence_count, score, paired_category,
                created_at, updated_at)
               VALUES %s ON CONFLICT DO NOTHING""",
            batch, page_size=BATCH_SIZE
        )
        conn.commit()
        inserted += len(batch)
        if inserted % 50000 == 0:
            print(f"  [{ts()}] Inserted {inserted:,}...")

    # ── Step 5: Verify ────────────────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM ingredient_pairings")
    final_count = cur.fetchone()[0]

    # Show top pairings for "chicken" as a sanity check
    cur.execute("""
        SELECT mi_anchor.name, mi_paired.name, ip.co_occurrence_count, ip.score
        FROM ingredient_pairings ip
        JOIN master_ingredients mi_anchor ON mi_anchor.id = ip.ingredient_id
        JOIN master_ingredients mi_paired ON mi_paired.id = ip.paired_ingredient_id
        WHERE mi_anchor.name = 'chicken'
        ORDER BY ip.score DESC
        LIMIT 15
    """)
    chicken_rows = cur.fetchall()

    print(f"\n[{ts()}] ✅ COMPUTATION COMPLETE")
    print(f"  ingredient_pairings rows: {final_count:,}")
    print(f"\n  Sanity check — top pairings for 'chicken':")
    print(f"  {'Ingredient':<25} {'Co-occur':>8} {'Score':>8}")
    print(f"  {'-'*45}")
    for row in chicken_rows:
        print(f"  {row[1]:<25} {row[2]:>8,} {float(row[3]):>8.4f}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    t = time.time()
    main()
    elapsed = time.time() - t
    print(f"\nTotal time: {elapsed/60:.1f} minutes")
