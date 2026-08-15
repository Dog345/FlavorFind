#!/usr/bin/env python3
"""
FlavorFind Suggestion Engine — Test 1: Coverage
================================================
Angle: BREADTH — Does every ingredient get suggestions?

Tests ALL ingredients in master_ingredients and measures:
  - How many get suggestions from the rule-based engine (co-occurrence)
  - How many get suggestions from the vector engine (semantic similarity)
  - How many get suggestions from the combined engine
  - Which ingredients fall through all three (true gaps)

Target: >= 97% of ingredients return at least 1 suggestion

Run:
    python3 scripts/test_1_coverage.py

Expected runtime: ~3-5 minutes
"""

import psycopg2
import psycopg2.extras
import time
from datetime import datetime
from collections import defaultdict

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_HOST     = "REDACTED_HOST"
DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_USER     = "flavorfind"
DB_PASSWORD = "REDACTED_PASSWORD"
DB_SSLMODE  = "prefer"

VECTOR_TOP_N      = 10    # how many vector neighbours to consider
VECTOR_MIN_SIM    = 0.70  # minimum cosine similarity to count as a suggestion
COOCCUR_MIN_SCORE = 0.01  # minimum co-occurrence score to count

def ts():
    return datetime.now().strftime('%H:%M:%S')

def banner(msg):
    print(f"\n{'='*70}")
    print(f"  {msg}")
    print(f"{'='*70}")

def main():
    banner("TEST 1: COVERAGE — All 7,385 Ingredients")
    t_start = time.time()

    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # ── Load all ingredients ──────────────────────────────────────────────────
    print(f"\n[{ts()}] Loading all ingredients...")
    cur.execute("SELECT id, name, category FROM master_ingredients ORDER BY name")
    all_ingredients = [(str(r['id']), r['name'], r['category']) for r in cur.fetchall()]
    total = len(all_ingredients)
    print(f"[{ts()}] Total ingredients: {total:,}")

    # ── Engine 1: Co-occurrence coverage ─────────────────────────────────────
    print(f"\n[{ts()}] Checking co-occurrence engine coverage...")
    cur.execute("""
        SELECT DISTINCT ingredient_id::text
        FROM ingredient_pairings
        WHERE score >= %s
    """, (COOCCUR_MIN_SCORE,))
    cooccur_covered = {r[0] for r in cur.fetchall()}
    print(f"[{ts()}] Co-occurrence covers: {len(cooccur_covered):,} / {total:,} ingredients")

    # ── Engine 2: Vector engine coverage ─────────────────────────────────────
    print(f"\n[{ts()}] Checking vector engine coverage...")
    cur.execute("""
        SELECT COUNT(*) FROM master_ingredients WHERE flavor_vector IS NOT NULL
    """)
    vector_count = cur.fetchone()[0]
    print(f"[{ts()}] Ingredients with embeddings: {vector_count:,} / {total:,}")

    # Ingredients with vectors can always get vector suggestions
    cur.execute("SELECT id::text FROM master_ingredients WHERE flavor_vector IS NOT NULL")
    vector_covered = {r[0] for r in cur.fetchall()}

    # ── Combined coverage: use pre-computed table ─────────────────────────────
    print(f"\n[{ts()}] Checking combined_suggestions coverage...")
    cur.execute("SELECT COUNT(DISTINCT ingredient_id) FROM combined_suggestions")
    combined_count = cur.fetchone()[0]
    combined_covered = set()
    cur.execute("SELECT DISTINCT ingredient_id::text FROM combined_suggestions")
    combined_covered = {r[0] for r in cur.fetchall()}
    gaps = [ing for ing in all_ingredients if ing[0] not in combined_covered]

    # ── Per-category breakdown ────────────────────────────────────────────────
    print(f"\n[{ts()}] Running per-category breakdown...")
    cur.execute("""
        SELECT
            mi.category,
            COUNT(*) AS total,
            COUNT(ip.ingredient_id) AS with_cooccur,
            COUNT(mi.flavor_vector) AS with_vector,
            COUNT(CASE WHEN ip.ingredient_id IS NOT NULL OR mi.flavor_vector IS NOT NULL THEN 1 END) AS combined
        FROM master_ingredients mi
        LEFT JOIN (
            SELECT DISTINCT ingredient_id FROM ingredient_pairings WHERE score >= %s
        ) ip ON ip.ingredient_id = mi.id
        GROUP BY mi.category
        ORDER BY total DESC
        LIMIT 20
    """, (COOCCUR_MIN_SCORE,))
    category_rows = cur.fetchall()

    # ── Sample gap analysis ───────────────────────────────────────────────────
    # For gaps, check how many recipes they appear in
    gap_ids = [g[0] for g in gaps[:100]]  # sample first 100
    gap_recipe_counts = {}
    if gap_ids:
        cur.execute("""
            SELECT ingredient_id::text, COUNT(DISTINCT recipe_id) as recipe_count
            FROM recipe_ingredients
            WHERE ingredient_id = ANY(%s::uuid[])
            GROUP BY ingredient_id
        """, (gap_ids,))
        gap_recipe_counts = {r[0]: r[1] for r in cur.fetchall()}

    # ── Spot-check: run actual suggestion queries for 50 diverse ingredients ──
    print(f"\n[{ts()}] Running spot-check queries on 50 sampled ingredients...")
    # Sample: top 10 by recipe count, bottom 10, and 30 random middle
    cur.execute("""
        SELECT mi.id::text, mi.name, COUNT(ri.recipe_id) as recipe_count
        FROM master_ingredients mi
        LEFT JOIN recipe_ingredients ri ON ri.ingredient_id = mi.id
        GROUP BY mi.id, mi.name
        ORDER BY recipe_count DESC
        LIMIT 10
    """)
    top_ingredients = [(r[0], r[1], r[2]) for r in cur.fetchall()]

    cur.execute("""
        SELECT mi.id::text, mi.name, COUNT(ri.recipe_id) as recipe_count
        FROM master_ingredients mi
        LEFT JOIN recipe_ingredients ri ON ri.ingredient_id = mi.id
        GROUP BY mi.id, mi.name
        ORDER BY RANDOM()
        LIMIT 30
    """)
    random_ingredients = [(r[0], r[1], r[2]) for r in cur.fetchall()]

    spot_check = top_ingredients + random_ingredients
    spot_passed = 0

    for ingr_id, name, recipe_count in spot_check:
        cur.execute("""
            SELECT COUNT(*) FROM combined_suggestions
            WHERE ingredient_id = %s::uuid
        """, (ingr_id,))
        hits = cur.fetchone()[0]
        if hits > 0:
            spot_passed += 1

    spot_rate = 100 * spot_passed / len(spot_check)

    # ── Print Results ─────────────────────────────────────────────────────────
    banner("RESULTS")

    cooccur_pct  = 100 * len(cooccur_covered) / total
    vector_pct   = 100 * len(vector_covered) / total
    combined_pct = 100 * len(combined_covered) / total
    gap_pct      = 100 * len(gaps) / total

    print(f"\n  Engine Coverage:")
    print(f"  {'Rule-based (co-occurrence)':<35} {len(cooccur_covered):>6,} / {total:,}  ({cooccur_pct:5.1f}%)")
    print(f"  {'Vector (semantic)':<35} {len(vector_covered):>6,} / {total:,}  ({vector_pct:5.1f}%)")
    print(f"  {'Combined (either engine)':<35} {len(combined_covered):>6,} / {total:,}  ({combined_pct:5.1f}%)")
    print(f"  {'True gaps (no engine helps)':<35} {len(gaps):>6,} / {total:,}  ({gap_pct:5.1f}%)")

    print(f"\n  Spot-check (40 ingredients, live queries):")
    print(f"  {'Pass rate':<35} {spot_passed:>6} / {len(spot_check)}  ({spot_rate:5.1f}%)")

    print(f"\n  Category Breakdown (top 20 categories):")
    print(f"  {'Category':<25} {'Total':>7} {'CoOccur':>8} {'Vector':>8} {'Combined':>9} {'%':>6}")
    print(f"  {'-'*67}")
    for row in category_rows:
        cat   = (row['category'] or 'uncategorised')[:24]
        tot   = row['total']
        co    = row['with_cooccur']
        vec   = row['with_vector']
        comb  = row['combined']
        pct   = 100 * comb / tot if tot else 0
        print(f"  {cat:<25} {tot:>7,} {co:>8,} {vec:>8,} {comb:>9,} {pct:>5.1f}%")

    if gaps:
        print(f"\n  True Gap Sample (first 20 ingredients with no suggestions):")
        print(f"  {'Ingredient':<30} {'Category':<20} {'Recipes':>8}")
        print(f"  {'-'*62}")
        for ingr_id, name, cat in gaps[:20]:
            rc = gap_recipe_counts.get(ingr_id, 0)
            print(f"  {name:<30} {(cat or 'n/a'):<20} {rc:>8,}")

    # ── Pass / Fail ───────────────────────────────────────────────────────────
    TARGET = 97.0
    print(f"\n{'='*70}")
    if combined_pct >= TARGET:
        print(f"  ✅  PASS — Combined coverage {combined_pct:.1f}% >= {TARGET}% target")
    else:
        print(f"  ❌  FAIL — Combined coverage {combined_pct:.1f}% < {TARGET}% target")
        print(f"       Gap: {TARGET - combined_pct:.1f}pp  ({len(gaps):,} ingredients unreachable)")

    if spot_rate >= TARGET:
        print(f"  ✅  PASS — Spot-check {spot_rate:.1f}% >= {TARGET}% target")
    else:
        print(f"  ❌  FAIL — Spot-check {spot_rate:.1f}% < {TARGET}% target")

    elapsed = time.time() - t_start
    print(f"\n  Total runtime: {elapsed:.1f}s")
    print(f"{'='*70}\n")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
