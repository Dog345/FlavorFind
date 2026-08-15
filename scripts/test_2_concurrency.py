#!/usr/bin/env python3
"""
FlavorFind Suggestion Engine — Test 2: Concurrency
===================================================
Angle: LOAD — Does the system hold under real user traffic?

Simulates 50 concurrent users all querying the suggestion engine
simultaneously. Measures:
  - Requests per second throughput
  - p50 / p95 / p99 latency
  - Error rate under load
  - Whether any query returns wrong or empty results under concurrency

Phases:
  Phase 1 — Ramp up: 10 threads, 30 seconds
  Phase 2 — Full load: 50 threads, 60 seconds
  Phase 3 — Spike: 100 threads, 15 seconds
  Phase 4 — Cool down: 10 threads, 15 seconds

Target:
  - Error rate < 1%
  - p95 latency < 500ms
  - Zero data corruption (every response is valid)

Run:
    python3 scripts/test_2_concurrency.py
"""

import psycopg2
import psycopg2.pool
import threading
import time
import random
import statistics
from datetime import datetime
from collections import defaultdict

# ─── CONFIG ───────────────────────────────────────────────────────────────────
import sys
# If --local flag passed, connect via localhost (run on the droplet for accurate latency)
if '--local' in sys.argv:
    DB_HOST    = "127.0.0.1"
    DB_USER    = "flavorfind"
    DB_PASSWORD = "Ff@Master2026!"
    print("  Mode: LOCAL (running on droplet, loopback connection)")
else:
    DB_HOST    = "134.209.20.131"
    DB_USER    = "flavorfind"
    DB_PASSWORD = "Ff@Master2026!"
    print("  Mode: REMOTE (running from dev machine — network latency included)")

DB_PORT     = 5432
DB_NAME     = "flavorfind"
DB_SSLMODE  = "prefer"

# Connection pool
POOL_MIN = 5
POOL_MAX = 120

VECTOR_MIN_SIM = 0.70

# ─── SHARED STATE ─────────────────────────────────────────────────────────────
lock         = threading.Lock()
results      = []          # list of (latency_ms, success, thread_id, ingredient_name)
errors       = []          # list of error messages
stop_event   = threading.Event()
pool         = None
all_ingr_ids = []          # pre-loaded list of (id, name)

def ts():
    return datetime.now().strftime('%H:%M:%S')

def banner(msg):
    print(f"\n{'='*70}\n  {msg}\n{'='*70}")

# ─── WORKER ───────────────────────────────────────────────────────────────────
def worker(thread_id: int):
    """
    Continuously picks a random ingredient and queries combined_suggestions
    (single indexed lookup — no live vector scan) until stop_event is set.
    """
    global pool, all_ingr_ids, results, errors

    while not stop_event.is_set():
        ingr_id, ingr_name = random.choice(all_ingr_ids)
        t0 = time.monotonic()
        success = False
        conn = None

        try:
            conn = pool.getconn()
            cur = conn.cursor()

            # Single indexed lookup — replaces both live co-occurrence + vector queries
            cur.execute("""
                SELECT suggestion_name, combined_score
                FROM combined_suggestions
                WHERE ingredient_id = %s::uuid
                ORDER BY rank
                LIMIT 10
            """, (ingr_id,))
            rows = cur.fetchall()

            # Validate: results returned and no nulls
            has_results = len(rows) > 0
            valid = all(r[0] is not None and r[1] is not None for r in rows)
            success = has_results and valid
            cur.close()

        except Exception as e:
            with lock:
                errors.append(f"Thread {thread_id} | {ingr_name}: {str(e)[:80]}")
        finally:
            if conn:
                try:
                    pool.putconn(conn)
                except Exception:
                    pass

        latency_ms = (time.monotonic() - t0) * 1000
        with lock:
            results.append((latency_ms, success, thread_id, ingr_name))

# ─── PHASE RUNNER ─────────────────────────────────────────────────────────────
def run_phase(name: str, n_threads: int, duration_s: int):
    global stop_event, results

    print(f"\n  ▸ Phase: {name} | {n_threads} threads | {duration_s}s")
    stop_event.clear()

    # Snapshot current result count
    with lock:
        snapshot_start = len(results)
        error_start = len(errors)

    threads = [threading.Thread(target=worker, args=(i,), daemon=True)
               for i in range(n_threads)]
    for t in threads:
        t.start()

    # Progress bar during phase
    deadline = time.time() + duration_s
    while time.time() < deadline:
        elapsed = duration_s - (deadline - time.time())
        with lock:
            phase_results = results[snapshot_start:]
            phase_done = len(phase_results)
            phase_errors = len(errors) - error_start
        bar_len = 30
        filled = int(bar_len * elapsed / duration_s)
        bar = "█" * filled + "░" * (bar_len - filled)
        rps = phase_done / max(elapsed, 0.1)
        print(f"\r    [{bar}] {elapsed:.0f}s  {phase_done:,} reqs  {rps:.1f} req/s  {phase_errors} err  ",
              end="", flush=True)
        time.sleep(0.5)

    stop_event.set()
    for t in threads:
        t.join(timeout=5)
    print()  # newline after progress bar

    # Phase summary
    with lock:
        phase_results = results[snapshot_start:]

    if phase_results:
        latencies = [r[0] for r in phase_results]
        successes = sum(1 for r in phase_results if r[1])
        latencies.sort()

        p50  = statistics.median(latencies)
        p95  = latencies[int(len(latencies) * 0.95)]
        p99  = latencies[int(len(latencies) * 0.99)]
        err_rate = 100 * (len(phase_results) - successes) / len(phase_results)
        rps  = len(phase_results) / duration_s

        print(f"    Results: {len(phase_results):,} reqs | {rps:.1f} req/s")
        print(f"    Latency: p50={p50:.0f}ms  p95={p95:.0f}ms  p99={p99:.0f}ms  max={max(latencies):.0f}ms")
        print(f"    Errors:  {len(phase_results) - successes} ({err_rate:.2f}%)")

        return {
            "name": name, "requests": len(phase_results), "rps": rps,
            "p50": p50, "p95": p95, "p99": p99,
            "max": max(latencies), "error_rate": err_rate
        }
    return None

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    global pool, all_ingr_ids

    banner("TEST 2: CONCURRENCY — 50 Threads, Live Load")

    # ── Build connection pool ─────────────────────────────────────────────────
    print(f"\n[{ts()}] Building connection pool (min={POOL_MIN}, max={POOL_MAX})...")
    pool = psycopg2.pool.ThreadedConnectionPool(
        POOL_MIN, POOL_MAX,
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, sslmode=DB_SSLMODE
    )
    print(f"[{ts()}] Pool ready.")

    # ── Pre-load ingredient list ──────────────────────────────────────────────
    conn = pool.getconn()
    cur = conn.cursor()
    cur.execute("SELECT id::text, name FROM master_ingredients ORDER BY name")
    all_ingr_ids = [(r[0], r[1]) for r in cur.fetchall()]
    cur.execute("SELECT COUNT(*) FROM ingredient_pairings")
    pairing_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM master_ingredients WHERE flavor_vector IS NOT NULL")
    vector_count = cur.fetchone()[0]
    cur.close()
    pool.putconn(conn)

    print(f"[{ts()}] Loaded {len(all_ingr_ids):,} ingredients")
    print(f"[{ts()}] Pairings: {pairing_count:,} | Embeddings: {vector_count:,}")

    # ── Run phases ────────────────────────────────────────────────────────────
    phase_results = []
    phases = [
        ("Ramp-up",    10,  30),
        ("Full load",  50,  60),
        ("Spike",     100,  15),
        ("Cool-down",  10,  15),
    ]

    for name, threads, duration in phases:
        result = run_phase(name, threads, duration)
        if result:
            phase_results.append(result)
        time.sleep(2)  # brief pause between phases

    # ── Final report ──────────────────────────────────────────────────────────
    banner("FINAL RESULTS")

    total_reqs = sum(p["requests"] for p in phase_results)
    total_errors_count = len(errors)
    overall_error_rate = 100 * total_errors_count / max(total_reqs, 1)
    all_latencies = sorted([r[0] for r in results])
    overall_p95 = all_latencies[int(len(all_latencies) * 0.95)] if all_latencies else 0
    overall_p99 = all_latencies[int(len(all_latencies) * 0.99)] if all_latencies else 0

    print(f"\n  {'Phase':<15} {'Reqs':>7} {'RPS':>7} {'p50':>7} {'p95':>7} {'p99':>7} {'Err%':>7}")
    print(f"  {'-'*60}")
    for p in phase_results:
        print(f"  {p['name']:<15} {p['requests']:>7,} {p['rps']:>7.1f} "
              f"{p['p50']:>6.0f}ms {p['p95']:>6.0f}ms {p['p99']:>6.0f}ms {p['error_rate']:>6.2f}%")

    print(f"\n  Overall:")
    print(f"  Total requests    : {total_reqs:,}")
    print(f"  Overall p95       : {overall_p95:.0f}ms")
    print(f"  Overall p99       : {overall_p99:.0f}ms")
    print(f"  Total errors      : {total_errors_count} ({overall_error_rate:.2f}%)")

    if errors:
        print(f"\n  Error sample (first 5):")
        for e in errors[:5]:
            print(f"    • {e}")

    # ── Pass / Fail ───────────────────────────────────────────────────────────
    print(f"\n{'='*70}")
    TARGET_ERROR_RATE = 1.0
    TARGET_P95_MS     = 500.0

    passed = True
    if overall_error_rate <= TARGET_ERROR_RATE:
        print(f"  ✅  PASS — Error rate {overall_error_rate:.2f}% <= {TARGET_ERROR_RATE}% target")
    else:
        print(f"  ❌  FAIL — Error rate {overall_error_rate:.2f}% > {TARGET_ERROR_RATE}% target")
        passed = False

    if overall_p95 <= TARGET_P95_MS:
        print(f"  ✅  PASS — p95 latency {overall_p95:.0f}ms <= {TARGET_P95_MS:.0f}ms target")
    else:
        print(f"  ❌  FAIL — p95 latency {overall_p95:.0f}ms > {TARGET_P95_MS:.0f}ms target")
        passed = False

    print(f"\n  Final verdict: {'✅  ALL TESTS PASSED' if passed else '❌  SOME TESTS FAILED'}")
    print(f"{'='*70}\n")

    pool.closeall()

if __name__ == "__main__":
    main()
