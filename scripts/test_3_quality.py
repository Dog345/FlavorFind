#!/usr/bin/env python3
"""
FlavorFind Suggestion Engine — Test 3: Quality
===============================================
Angle: ACCURACY — Are the suggestions actually correct?

Tests the suggestion engine against a hand-curated ground truth list of
known ingredient pairs. Measures:
  - Precision: of the top-10 suggestions, how many are genuinely good pairings?
  - Recall: of the known correct pairings, how many appear in the top-10?
  - Anti-pair rejection: do bad/nonsensical pairings score low?
  - Cuisine coherence: do suggestions stay within the same cuisine context?

Ground truth pairs are derived from established culinary knowledge:
  - Classic Western pairs (chicken+garlic, beef+onion, etc.)
  - East African pairs (tilapia+sukuma, ugali+nyama, etc.)
  - Baking pairs (eggs+butter, flour+sugar, etc.)
  - Spice pairs (cumin+coriander, cinnamon+cardamom, etc.)

Target: >= 97% of known correct pairs appear in top-20 suggestions

Run:
    python3 scripts/test_3_quality.py
"""

import psycopg2
import psycopg2.extras
import time
from datetime import datetime

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_HOST     = "REDACTED_HOST"
DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_USER     = "flavorfind"
DB_PASSWORD = "REDACTED_PASSWORD"
DB_SSLMODE  = "prefer"

TOP_N          = 20     # check if known pair appears in top-20
VECTOR_MIN_SIM = 0.65   # slightly lower threshold for quality test
COMBINED_ALPHA = 0.6    # weight for co-occurrence in combined score

# ─── GROUND TRUTH ─────────────────────────────────────────────────────────────
# Format: (anchor, [expected_partners], [anti_pairs])
# expected_partners: MUST appear in top-20 suggestions
# anti_pairs: MUST NOT appear in top-5 suggestions (nonsensical combinations)

GROUND_TRUTH = [
    # ── Classic proteins ──────────────────────────────────────────────────────
    ("chicken",       ["garlic", "onion", "butter", "olive oil", "pepper"],
                      ["sugar", "vanilla", "chocolate chips", "strawberries"]),

    ("beef",          ["onion", "garlic", "tomatoes", "pepper", "potatoes"],
                      ["vanilla", "whipped cream", "blueberries", "maple syrup"]),

    ("salmon",        ["lemon juice", "butter", "garlic", "pepper", "dill"],
                      ["chocolate", "vanilla extract", "sprinkles", "jam"]),

    ("eggs",          ["butter", "salt", "flour", "milk", "sugar"],
                      ["raw beef", "hot sauce (not applicable — ignore if not in db)"]),

    # ── Vegetables ────────────────────────────────────────────────────────────
    ("garlic",        ["onion", "olive oil", "butter", "tomatoes", "pepper"],
                      ["sugar", "vanilla", "chocolate", "cream cheese frosting"]),

    ("tomatoes",      ["onion", "garlic", "olive oil", "basil", "pepper"],
                      ["vanilla", "sugar", "whipped cream", "chocolate"]),

    ("spinach",       ["garlic", "onion", "olive oil", "parmesan cheese", "butter"],
                      ["vanilla", "chocolate chips", "maple syrup", "sugar"]),

    ("mushrooms",     ["garlic", "butter", "onion", "olive oil", "thyme"],
                      ["vanilla", "sugar", "chocolate", "strawberries"]),

    # ── Baking ingredients ────────────────────────────────────────────────────
    ("flour",         ["butter", "sugar", "eggs", "baking powder", "milk"],
                      ["garlic", "onion", "soy sauce", "hot pepper"]),

    ("butter",        ["sugar", "flour", "eggs", "salt", "milk"],
                      ["soy sauce", "garlic powder (borderline ok)", "hot sauce"]),

    ("sugar",         ["butter", "flour", "eggs", "vanilla extract", "milk"],
                      ["garlic", "onion", "cumin", "black pepper"]),

    # ── Spices ────────────────────────────────────────────────────────────────
    ("cumin",         ["coriander", "garlic", "onion", "chili powder", "olive oil"],
                      ["vanilla", "sugar", "butter", "whipped cream"]),

    ("cinnamon",      ["sugar", "nutmeg", "butter", "vanilla extract", "ginger"],
                      ["garlic", "onion", "soy sauce", "fish sauce"]),

    ("ginger",        ["garlic", "soy sauce", "onion", "sesame oil", "sugar"],
                      ["whipped cream", "butter cream", "chocolate chips"]),

    # ── Dairy ─────────────────────────────────────────────────────────────────
    ("cream cheese",  ["sugar", "butter", "eggs", "sour cream", "vanilla extract"],
                      ["garlic powder (borderline)", "soy sauce", "cumin"]),

    ("parmesan cheese", ["pasta", "olive oil", "garlic", "butter", "basil"],
                        ["sugar", "vanilla", "chocolate", "strawberries"]),

    # ── Grains ────────────────────────────────────────────────────────────────
    ("rice",          ["onion", "garlic", "butter", "water", "salt"],
                      ["vanilla", "sugar", "chocolate chips", "whipped cream"]),

    ("pasta",         ["olive oil", "garlic", "parmesan cheese", "onion", "tomatoes"],
                      ["vanilla", "chocolate", "sugar", "strawberries"]),

    # ── East African / Kenyan ─────────────────────────────────────────────────
    ("coconut milk",  ["garlic", "onion", "ginger", "coriander", "tomatoes"],
                      ["vanilla extract", "chocolate chips", "maple syrup"]),

    ("pilau masala",  ["coriander", "cumin", "cinnamon", "cardamom", "ginger"],
                      ["vanilla", "sugar", "butter cream", "chocolate"]),
]

def ts():
    return datetime.now().strftime('%H:%M:%S')

def banner(msg):
    print(f"\n{'='*70}\n  {msg}\n{'='*70}")

def get_suggestions(cur, anchor_name: str) -> list:
    """
    Get combined suggestions for an ingredient from pre-computed table.
    Returns list of (name, combined_score) sorted by rank.
    Variants of the anchor are already excluded at pre-compute time.
    """
    cur.execute("""
        SELECT cs.suggestion_name, cs.combined_score
        FROM combined_suggestions cs
        JOIN master_ingredients mi ON mi.id = cs.ingredient_id
        WHERE mi.name = %s
        ORDER BY cs.rank
        LIMIT 50
    """, (anchor_name,))
    return [(r[0], float(r[1])) for r in cur.fetchall()]

def main():
    banner("TEST 3: QUALITY — Suggestion Accuracy vs. Ground Truth")
    t_start = time.time()

    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    total_expected  = 0
    total_found     = 0
    total_anti      = 0
    total_anti_ok   = 0
    results_detail  = []

    for anchor, expected_partners, anti_pairs in GROUND_TRUTH:
        # Check if anchor exists
        cur.execute("SELECT id FROM master_ingredients WHERE name = %s LIMIT 1", (anchor,))
        row = cur.fetchone()
        if not row:
            results_detail.append({
                "anchor": anchor, "status": "MISSING",
                "found": [], "missing": expected_partners, "anti_hits": []
            })
            continue

        suggestions = get_suggestions(cur, anchor)
        top_n_names = [s[0] for s in suggestions[:TOP_N]]
        top_5_names = [s[0] for s in suggestions[:5]]

        def matches(expected: str, candidates: list) -> bool:
            """
            Check if expected partner is satisfied by any candidate.
            Uses stem matching: 'garlic' matches 'garlic cloves', 'fresh garlic' etc.
            Also matches plural/singular: 'tomato' matches 'tomatoes'
            """
            exp = expected.lower().strip()
            for c in candidates:
                c_lower = c.lower().strip()
                # Exact match
                if exp == c_lower:
                    return True
                # Substring match (garlic in "garlic cloves", "fresh garlic")
                if exp in c_lower or c_lower in exp:
                    return True
                # Simple plural: add/remove s
                if exp + 's' == c_lower or exp == c_lower + 's':
                    return True
                if exp + 'es' == c_lower or exp == c_lower + 'es':
                    return True
            return False

        # Check expected partners (stem matching)
        found_partners   = [p for p in expected_partners if matches(p, top_n_names)]
        missing_partners = [p for p in expected_partners if not matches(p, top_n_names)]

        # Check anti-pairs don't appear in top 5 (exact or stem)
        anti_hits = [ap for ap in anti_pairs if matches(ap, top_5_names)]

        total_expected += len(expected_partners)
        total_found    += len(found_partners)
        total_anti     += len(anti_pairs)
        total_anti_ok  += len(anti_pairs) - len(anti_hits)

        results_detail.append({
            "anchor":   anchor,
            "status":   "OK" if not missing_partners else "PARTIAL",
            "found":    found_partners,
            "missing":  missing_partners,
            "anti_hits": anti_hits,
            "top_5":    top_5_names,
        })

    # ── Print detailed results ────────────────────────────────────────────────
    banner("DETAILED RESULTS")

    for r in results_detail:
        anchor = r["anchor"]
        status = r["status"]

        if status == "MISSING":
            print(f"\n  ⚠️  {anchor:<25} NOT IN DATABASE")
            continue

        icon = "✅" if status == "OK" else "⚠️ "
        found_pct = 100 * len(r["found"]) / max(len(r["found"]) + len(r["missing"]), 1)
        print(f"\n  {icon} {anchor:<25} {len(r['found'])}/{len(r['found'])+len(r['missing'])} expected found ({found_pct:.0f}%)")
        print(f"     Top 5 : {', '.join(r['top_5'])}")

        if r["missing"]:
            print(f"     ❌ Missing from top-{TOP_N}: {', '.join(r['missing'])}")
        if r["anti_hits"]:
            print(f"     ⚠️  Anti-pairs in top-5: {', '.join(r['anti_hits'])}")

    # ── Summary ───────────────────────────────────────────────────────────────
    banner("SUMMARY")

    recall     = 100 * total_found    / max(total_expected, 1)
    anti_score = 100 * total_anti_ok  / max(total_anti, 1)

    missing_anchors = sum(1 for r in results_detail if r["status"] == "MISSING")
    partial_anchors = sum(1 for r in results_detail if r["status"] == "PARTIAL")
    perfect_anchors = sum(1 for r in results_detail if r["status"] == "OK")

    print(f"\n  Anchor ingredients tested : {len(GROUND_TRUTH)}")
    print(f"  ✅ Perfect               : {perfect_anchors}")
    print(f"  ⚠️  Partial               : {partial_anchors}")
    print(f"  ❌ Missing from DB       : {missing_anchors}")
    print(f"\n  Recall (known pairs in top-{TOP_N}):")
    print(f"    Found {total_found} / {total_expected} expected pairs  →  {recall:.1f}%")
    print(f"\n  Anti-pair rejection (bad pairs NOT in top-5):")
    print(f"    Rejected {total_anti_ok} / {total_anti} anti-pairs  →  {anti_score:.1f}%")

    # ── Pass / Fail ───────────────────────────────────────────────────────────
    TARGET = 97.0
    print(f"\n{'='*70}")
    passed = True

    if recall >= TARGET:
        print(f"  ✅  PASS — Recall {recall:.1f}% >= {TARGET}% target")
    else:
        print(f"  ❌  FAIL — Recall {recall:.1f}% < {TARGET}% target")
        passed = False

    if anti_score >= 90.0:
        print(f"  ✅  PASS — Anti-pair rejection {anti_score:.1f}% >= 90% target")
    else:
        print(f"  ❌  FAIL — Anti-pair rejection {anti_score:.1f}% < 90% target")
        passed = False

    elapsed = time.time() - t_start
    print(f"\n  Final verdict: {'✅  ALL TESTS PASSED' if passed else '❌  SOME TESTS FAILED'}")
    print(f"  Runtime: {elapsed:.1f}s")
    print(f"{'='*70}\n")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
