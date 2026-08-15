#!/usr/bin/env python3
"""
FlavorFind Ingredient Embedding Generator
==========================================
Generates semantic embeddings for all ingredients in master_ingredients
using Google's gemini-embedding-001 model.

Embeddings are stored in master_ingredients.flavor_vector as vector(768).
We use the first 768 dimensions of the 3072-dim output (truncation).

Usage:
  python3 scripts/generate_embeddings.py

Rate limits: Google free tier allows 1500 requests/minute.
We batch 100 ingredients per request and add small delays.
7,385 ingredients / 100 per batch = ~74 API calls → ~1-2 minutes total.
"""

import psycopg2
import psycopg2.extras
import urllib.request
import json
import time
from datetime import datetime

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_HOST     = "134.209.20.131"
DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_USER     = "flavorfind"
DB_PASSWORD = "Ff@Master2026!"
DB_SSLMODE  = "prefer"

GOOGLE_API_KEY  = "AIzaSyCCJ1LRFg27HpQK6najHR7I4Ixxg17u-EI"
EMBED_MODEL     = "gemini-embedding-001"
EMBED_DIMS      = 768       # truncate from 3072 to 768
BATCH_SIZE      = 100       # ingredients per API call (Google supports batch embed)
DELAY_BETWEEN   = 0.5       # seconds between API calls

def ts():
    return datetime.now().strftime('%H:%M:%S')

def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Send a batch of texts to Google embedding API.
    Returns list of 768-dim vectors (truncated from 3072).
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBED_MODEL}:batchEmbedContents?key={GOOGLE_API_KEY}"

    requests_payload = [
        {"model": f"models/{EMBED_MODEL}", "content": {"parts": [{"text": t}]}}
        for t in texts
    ]

    payload = json.dumps({"requests": requests_payload}).encode()
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json"}
    )

    max_retries = 3
    for attempt in range(max_retries):
        try:
            res = urllib.request.urlopen(req, timeout=30)
            data = json.loads(res.read())
            vectors = []
            for emb in data["embeddings"]:
                full_vec = emb["values"]
                # Truncate to first 768 dimensions
                vectors.append(full_vec[:EMBED_DIMS])
            return vectors
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if e.code == 429:
                # Rate limit — wait longer
                wait = 60 * (attempt + 1)
                print(f"  Rate limit hit. Waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  API error {e.code}: {body[:200]}")
                raise
    raise Exception("Max retries exceeded")

def vec_to_pg(vec: list[float]) -> str:
    """Convert Python list to PostgreSQL vector literal: '[0.1,0.2,...]'"""
    return "[" + ",".join(f"{v:.6f}" for v in vec) + "]"

def main():
    print(f"[{ts()}] Connecting to DB...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    conn.autocommit = False
    cur = conn.cursor()
    print(f"[{ts()}] Connected.\n")

    # Load ingredients that don't have embeddings yet
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
        return

    processed = 0
    errors = 0

    for i in range(0, total, BATCH_SIZE):
        batch = ingredients[i:i + BATCH_SIZE]
        ids   = [r[0] for r in batch]
        names = [r[1] for r in batch]

        try:
            vectors = embed_batch(names)

            # Update each ingredient with its vector
            for ingr_id, vec in zip(ids, vectors):
                cur.execute(
                    "UPDATE master_ingredients SET flavor_vector = %s WHERE id = %s",
                    (vec_to_pg(vec), ingr_id)
                )

            conn.commit()
            processed += len(batch)

            if processed % 500 == 0 or processed == total:
                print(f"  [{ts()}] {processed:,}/{total:,} embeddings generated...")

            time.sleep(DELAY_BETWEEN)

        except Exception as e:
            print(f"  ERROR on batch {i}–{i+BATCH_SIZE}: {e}")
            conn.rollback()
            errors += len(batch)
            time.sleep(5)
            continue

    # Verify
    cur.execute("SELECT COUNT(*) FROM master_ingredients WHERE flavor_vector IS NOT NULL")
    done = cur.fetchone()[0]

    print(f"\n[{ts()}] ✅ EMBEDDING COMPLETE")
    print(f"  Ingredients with embeddings: {done:,} / {total + done - errors:,}")
    print(f"  Errors: {errors}")

    # Quick similarity test — what's most similar to 'chicken'?
    cur.execute("""
        SELECT name, 1 - (flavor_vector <=> (
            SELECT flavor_vector FROM master_ingredients WHERE name = 'chicken'
        )) AS similarity
        FROM master_ingredients
        WHERE name != 'chicken' AND flavor_vector IS NOT NULL
        ORDER BY flavor_vector <=> (
            SELECT flavor_vector FROM master_ingredients WHERE name = 'chicken'
        )
        LIMIT 15
    """)
    rows = cur.fetchall()

    print(f"\n  Vector similarity test — most similar to 'chicken':")
    print(f"  {'Ingredient':<25} {'Similarity':>10}")
    print(f"  {'-'*38}")
    for row in rows:
        print(f"  {row[0]:<25} {float(row[1]):>10.4f}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    t = time.time()
    main()
    print(f"\nTotal time: {(time.time()-t)/60:.1f} minutes")
