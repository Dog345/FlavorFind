#!/usr/bin/env python3
"""
FlavorFind — Pre-compute Combined Suggestions
=============================================
Creates a combined_suggestions table that merges:
  1. Co-occurrence scores  (rule-based engine)
  2. Vector similarity     (semantic engine)

Into a single pre-computed score per (anchor → suggestion) pair.

Crucially this script also DEDUPLICATES ingredient variants:
  chicken, chicken meat, chicken breast, chicken pieces
  → treated as the same ingredient cluster
  → variants of the anchor are excluded from its own suggestions

This means:
  - Querying suggestions = ONE indexed lookup (no live vector scan)
  - p95 latency drops from ~4000ms to <50ms
  - Variant crowding is eliminated from results

Combined score formula:
  score = 0.6 × co_occurrence_normalised + 0.4 × vector_similarity
  (co-occurrence normalised: raw_score × 2, capped at 1.0)

Deduplication logic:
  - Ingredients sharing a common root word are in the same cluster
  - e.g. "chicken", "chicken breast", "chicken meat" → cluster "chicken"
  - Suggestions that are in the same cluster as the anchor are excluded

Usage:
    python3 scripts/compute_combined_suggestions.py

Runtime: ~20-40 minutes (vector similarity is computed for all pairs)
"""

import psycopg2
import psycopg2.extras
import time
from datetime import datetime
from collections import defaultdict

DB_HOST     = "REDACTED_HOST"
DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_USER     = "flavorfind"
DB_PASSWORD = "REDACTED_PASSWORD"
DB_SSLMODE  = "prefer"

VECTOR_MIN_SIM  = 0.65   # minimum vector similarity to include
COMBINED_ALPHA  = 0.6    # weight for co-occurrence
TOP_N           = 50     # top suggestions to store per anchor
BATCH_SIZE      = 100    # anchors processed per DB commit

def ts():
    return datetime.now().strftime('%H:%M:%S')

def banner(msg):
    print(f"\n{'='*65}\n  {msg}\n{'='*65}")

def main():
    banner("Pre-computing Combined Suggestions")
    t_start = time.time()

    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # ── Step 1: Create combined_suggestions table ─────────────────────────────
    print(f"\n[{ts()}] Creating combined_suggestions table...")
    cur.execute("DROP TABLE IF EXISTS combined_suggestions")
    cur.execute("""
        CREATE TABLE combined_suggestions (
            id                  SERIAL PRIMARY KEY,
            ingredient_id       UUID NOT NULL REFERENCES master_ingredients(id) ON DELETE CASCADE,
            suggestion_id       UUID NOT NULL REFERENCES master_ingredients(id) ON DELETE CASCADE,
            suggestion_name     TEXT NOT NULL,
            suggestion_category TEXT,
            co_occurrence_score NUMERIC(8,5) DEFAULT 0,
            vector_score        NUMERIC(8,5) DEFAULT 0,
            combined_score      NUMERIC(8,5) NOT NULL,
            rank                INTEGER NOT NULL,
            UNIQUE (ingredient_id, suggestion_id)
        )
    """)
    # Index for fast lookup: given ingredient_id, get top suggestions by rank
    cur.execute("""
        CREATE INDEX cs_ingredient_rank_idx
        ON combined_suggestions (ingredient_id, rank ASC)
    """)
    conn.commit()
    print(f"[{ts()}] Table created with index.")

    # ── Step 2: Load all ingredients ──────────────────────────────────────────
    print(f"\n[{ts()}] Loading ingredients...")
    cur.execute("SELECT id::text, name, category FROM master_ingredients ORDER BY name")
    all_ingredients = [(r['id'], r['name'], r['category']) for r in cur.fetchall()]
    total = len(all_ingredients)
    print(f"[{ts()}] {total:,} ingredients loaded.")

    # Build name→id and id→name lookups
    name_to_id = {r[1]: r[0] for r in all_ingredients}
    id_to_name = {r[0]: r[1] for r in all_ingredients}
    id_to_cat  = {r[0]: r[2] for r in all_ingredients}

    # ── Step 3: Build variant sets using name-substring matching ─────────────
    # Rule: if anchor name appears as a whole word inside candidate name,
    # the candidate is a variant of the anchor and excluded from its suggestions.
    #
    # "chicken" → excludes "boneless chicken breast", "chicken tenderloins",
    #             "baby chickens", "parmesan chicken", "vegan chicken"
    # "garlic"  → excludes "garlic cloves", "fresh garlic", "garlic powder"
    #
    # We do NOT use vectors here. Vectors find similar *concepts* — "chicken"
    # and "beef" are both proteins so they're vectorially close, but they are
    # not variants of each other. Name matching is the right tool for this.
    print(f"\n[{ts()}] Building variant sets via name-substring matching...")

    import re

    variant_ids = defaultdict(set)
    variant_pairs_found = 0

    for anchor_id, anchor_name, anchor_cat in all_ingredients:
        anchor_lower = anchor_name.lower()
        try:
            # Match anchor word + optional common suffixes (s, es, ed, ing, er, ly).
            # "chicken" now matches: chickens, chicken breast, frying chickens, etc.
            # "tomato"  now matches: tomatoes, tomato paste, sun-dried tomatoes
            # "garlic"  now matches: garlicky, garlic powder
            # \b before the anchor still prevents "egg" matching "eggplant"
            pattern = re.compile(
                r'\b' + re.escape(anchor_lower) + r'(?:s|es|ed|ing|er|ly)?\b'
            )
        except re.error:
            continue

        for cand_id, cand_name, cand_cat in all_ingredients:
            if cand_id == anchor_id:
                continue
            # Strip dirty characters before comparing (catches "eggs}" etc.)
            cand_lower = re.sub(r'[^a-z0-9 ,\-]', '', cand_name.lower()).strip()
            # Candidate must be longer (a variant is always more specific)
            if len(cand_lower) > len(anchor_lower) and pattern.search(cand_lower):
                variant_ids[anchor_id].add(cand_id)
                variant_pairs_found += 1

    total_variants = sum(len(v) for v in variant_ids.values())
    print(f"[{ts()}] {total_variants:,} variant relationships identified")

    # Sanity check
    chicken_id_check = next((i for i, n, c in all_ingredients if n == 'chicken'), None)
    if chicken_id_check:
        sample_names = [id_to_name[i] for i in list(variant_ids.get(chicken_id_check, set()))[:6]]
        print(f"  'chicken' variants sample: {sample_names}")

    # ── Step 4: Load all co-occurrence scores into memory ─────────────────────
    print(f"\n[{ts()}] Loading co-occurrence scores into memory...")
    cur.execute("""
        SELECT ingredient_id::text, paired_ingredient_id::text, score
        FROM ingredient_pairings
    """)
    cooccur_map = defaultdict(dict)  # anchor_id → {paired_id: score}
    for row in cur.fetchall():
        cooccur_map[row[0]][row[1]] = float(row[2])
    print(f"[{ts()}] Loaded {sum(len(v) for v in cooccur_map.values()):,} co-occurrence pairs")

    # ── Step 5: Process each anchor ───────────────────────────────────────────
    print(f"\n[{ts()}] Computing combined scores for all {total:,} anchors...")
    print(f"         (Vector similarity computed live per anchor — this takes time)\n")

    inserted_total = 0
    processed = 0

    # Use server-side cursor for vector queries to avoid memory issues
    for batch_start in range(0, total, BATCH_SIZE):
        batch = all_ingredients[batch_start:batch_start + BATCH_SIZE]
        batch_rows = []

        for anchor_id, anchor_name, anchor_cat in batch:
            anchor_variants = variant_ids.get(anchor_id, set())

            # ── Get vector neighbours ─────────────────────────────────────────
            cur.execute("""
                SELECT
                    cand.id::text,
                    ROUND((1 - (cand.flavor_vector <=> anchor.flavor_vector))::numeric, 5) AS sim
                FROM master_ingredients anchor,
                     master_ingredients cand
                WHERE anchor.id = %s::uuid
                  AND cand.id  != %s::uuid
                  AND anchor.flavor_vector IS NOT NULL
                  AND cand.flavor_vector   IS NOT NULL
                  AND (1 - (cand.flavor_vector <=> anchor.flavor_vector)) >= %s
                ORDER BY cand.flavor_vector <=> anchor.flavor_vector
                LIMIT 100
            """, (anchor_id, anchor_id, VECTOR_MIN_SIM))
            vector_neighbours = {r[0]: float(r[1]) for r in cur.fetchall()}

            # ── Merge with co-occurrence ──────────────────────────────────────
            co_pairs   = cooccur_map.get(anchor_id, {})
            all_cands  = set(vector_neighbours.keys()) | set(co_pairs.keys())

            scored = []
            for cand_id in all_cands:
                # Skip variants of the anchor (deduplication)
                if cand_id in anchor_variants:
                    continue
                # Skip self
                if cand_id == anchor_id:
                    continue

                co_raw  = co_pairs.get(cand_id, 0.0)
                co_norm = min(co_raw * 2.0, 1.0)   # normalise to 0-1
                vec_sim = vector_neighbours.get(cand_id, 0.0)
                combined = COMBINED_ALPHA * co_norm + (1 - COMBINED_ALPHA) * vec_sim

                scored.append((cand_id, co_raw, vec_sim, combined))

            # Sort by combined score, take top N
            scored.sort(key=lambda x: -x[3])
            top = scored[:TOP_N]

            for rank, (cand_id, co_raw, vec_sim, combined) in enumerate(top, start=1):
                batch_rows.append((
                    anchor_id,
                    cand_id,
                    id_to_name.get(cand_id, ''),
                    id_to_cat.get(cand_id),
                    round(co_raw, 5),
                    round(vec_sim, 5),
                    round(combined, 5),
                    rank,
                ))

        # Bulk insert batch
        if batch_rows:
            psycopg2.extras.execute_values(cur, """
                INSERT INTO combined_suggestions
                    (ingredient_id, suggestion_id, suggestion_name, suggestion_category,
                     co_occurrence_score, vector_score, combined_score, rank)
                VALUES %s
                ON CONFLICT DO NOTHING
            """, batch_rows, page_size=500)
            conn.commit()
            inserted_total += len(batch_rows)

        processed += len(batch)
        pct = 100 * processed // total
        elapsed = time.time() - t_start
        eta = (elapsed / max(processed, 1)) * (total - processed)
        print(f"\r  [{ts()}] {processed:,}/{total:,} ({pct}%)  "
              f"{inserted_total:,} rows inserted  ETA: {eta/60:.1f}min   ",
              end="", flush=True)

    print()  # newline after progress

    # ── Step 6: Verify ────────────────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM combined_suggestions")
    final_count = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(DISTINCT ingredient_id) FROM combined_suggestions
    """)
    covered = cur.fetchone()[0]

    # Sanity check — top suggestions for chicken (should NOT contain chicken variants)
    cur.execute("""
        SELECT suggestion_name, co_occurrence_score, vector_score, combined_score
        FROM combined_suggestions cs
        JOIN master_ingredients mi ON mi.id = cs.ingredient_id
        WHERE mi.name = 'chicken'
        ORDER BY rank
        LIMIT 15
    """)
    chicken_rows = cur.fetchall()

    banner("COMPLETE")
    elapsed_total = time.time() - t_start
    print(f"  combined_suggestions rows  : {final_count:,}")
    print(f"  Ingredients covered        : {covered:,} / {total:,} ({100*covered//total}%)")
    print(f"  Total runtime              : {elapsed_total/60:.1f} minutes")

    print(f"\n  Sanity check — top suggestions for 'chicken' (variants excluded):")
    print(f"  {'Suggestion':<28} {'CoOccur':>8} {'Vector':>8} {'Combined':>9}")
    print(f"  {'-'*57}")
    for r in chicken_rows:
        print(f"  {r[0]:<28} {float(r[1]):>8.4f} {float(r[2]):>8.4f} {float(r[3]):>9.4f}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
