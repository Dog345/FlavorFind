#!/usr/bin/env python3
"""
FlavorFind Ingredient Embedding Generator — Vertex AI
======================================================
Generates semantic embeddings for all ingredients in master_ingredients
using Google's text-embedding-005 model via Vertex AI.

Uses Application Default Credentials (ADC) — no API key needed.
Billed to: vertext-project (GCP)

Model: text-embedding-005
  - 768-dimension output (fits pgvector index limit of 2000)
  - Optimised for semantic similarity tasks
  - ~$0.00002 per 1000 characters → ~$0.002 total for 7,385 ingredients

Usage:
    python3 scripts/generate_embeddings_vertex.py

Runtime: ~3–5 minutes
"""

import psycopg2
import psycopg2.extras
import time
from datetime import datetime

import vertexai
from vertexai.language_models import TextEmbeddingModel, TextEmbeddingInput

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_HOST     = "REDACTED_HOST"
DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_USER     = "flavorfind"
DB_PASSWORD = "REDACTED_PASSWORD"
DB_SSLMODE  = "prefer"

GCP_PROJECT  = "vertext-project"
GCP_LOCATION = "us-central1"
EMBED_MODEL  = "text-embedding-005"   # 768 dims, fits pgvector 0.6.0

BATCH_SIZE   = 250   # Vertex AI supports up to 250 texts per request
DELAY        = 0.1   # seconds between batches (no hard rate limit on paid tier)

def ts():
    return datetime.now().strftime('%H:%M:%S')

def vec_to_pg(vec: list) -> str:
    """Convert Python list to PostgreSQL vector literal: '[0.1,0.2,...]'"""
    return "[" + ",".join(f"{v:.6f}" for v in vec) + "]"

def main():
    # ── Init Vertex AI ────────────────────────────────────────────────────────
    print(f"[{ts()}] Initialising Vertex AI (project={GCP_PROJECT}, location={GCP_LOCATION})...")
    vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)
    model = TextEmbeddingModel.from_pretrained(EMBED_MODEL)
    print(f"[{ts()}] Model loaded: {EMBED_MODEL}\n")

    # ── Connect to DB ─────────────────────────────────────────────────────────
    print(f"[{ts()}] Connecting to DB...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    conn.autocommit = False
    cur = conn.cursor()
    print(f"[{ts()}] Connected.\n")

    # ── Load ingredients without embeddings ───────────────────────────────────
    cur.execute("""
        SELECT id, name FROM master_ingredients
        WHERE flavor_vector IS NULL
        ORDER BY name
    """)
    ingredients = [(str(row[0]), row[1]) for row in cur.fetchall()]
    total = len(ingredients)
    print(f"[{ts()}] {total:,} ingredients need embeddings\n")

    if total == 0:
        print("All ingredients already have embeddings.")
        # Still run the similarity test
        run_similarity_test(cur)
        conn.close()
        return

    processed = 0
    errors = 0

    for i in range(0, total, BATCH_SIZE):
        batch      = ingredients[i:i + BATCH_SIZE]
        ids        = [r[0] for r in batch]
        names      = [r[1] for r in batch]

        try:
            # Vertex AI batch embed — task_type SEMANTIC_SIMILARITY for ingredient matching
            inputs = [TextEmbeddingInput(text=name, task_type="SEMANTIC_SIMILARITY") for name in names]
            embeddings = model.get_embeddings(inputs)

            for ingr_id, emb in zip(ids, embeddings):
                vec = emb.values  # list of 768 floats
                cur.execute(
                    "UPDATE master_ingredients SET flavor_vector = %s WHERE id = %s",
                    (vec_to_pg(vec), ingr_id)
                )

            conn.commit()
            processed += len(batch)

            # Progress update every 500
            if processed % 500 == 0 or processed == total:
                pct = 100 * processed // total
                print(f"  [{ts()}] {processed:,}/{total:,} ({pct}%) embeddings done...")

            time.sleep(DELAY)

        except Exception as e:
            print(f"  ERROR on batch starting at index {i}: {e}")
            conn.rollback()
            errors += len(batch)
            time.sleep(5)
            continue

    # ── Verify ────────────────────────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM master_ingredients WHERE flavor_vector IS NOT NULL")
    done = cur.fetchone()[0]

    print(f"\n[{ts()}] ✅  EMBEDDING COMPLETE")
    print(f"  Ingredients embedded : {done:,}")
    print(f"  Errors               : {errors}")

    run_similarity_test(cur)

    cur.close()
    conn.close()

def run_similarity_test(cur):
    """Print top-15 most similar ingredients to a few test anchors."""
    anchors = ["chicken", "tilapia", "cinnamon", "avocado"]

    for anchor in anchors:
        cur.execute("""
            SELECT name,
                   ROUND((1 - (flavor_vector <=> anchor.vec))::numeric, 4) AS similarity
            FROM master_ingredients,
                 (SELECT flavor_vector AS vec
                  FROM master_ingredients
                  WHERE name = %s AND flavor_vector IS NOT NULL
                  LIMIT 1) anchor
            WHERE name != %s
              AND flavor_vector IS NOT NULL
            ORDER BY flavor_vector <=> anchor.vec
            LIMIT 10
        """, (anchor, anchor))
        rows = cur.fetchall()

        if not rows:
            print(f"\n  [{anchor}] — no embedding found, skipping")
            continue

        print(f"\n  Vector similarity — most similar to '{anchor}':")
        print(f"  {'Ingredient':<28} {'Similarity':>10}")
        print(f"  {'-'*40}")
        for row in rows:
            print(f"  {row[0]:<28} {float(row[1]):>10.4f}")

if __name__ == "__main__":
    t = time.time()
    main()
    elapsed = time.time() - t
    print(f"\nTotal time: {elapsed/60:.1f} minutes")
