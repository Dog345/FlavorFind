#!/bin/bash
# ============================================================
# FlavorFind — Run all 3 suggestion engine tests concurrently
# ============================================================
# Launches test_1, test_2, test_3 in parallel.
# Each writes its output to a log file AND the terminal.
# Waits for all to finish, then prints a combined summary.
#
# Usage:
#   chmod +x scripts/run_all_tests.sh
#   ./scripts/run_all_tests.sh

cd "$(dirname "$0")/.." || exit 1

LOGS_DIR="scripts/test_logs"
mkdir -p "$LOGS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "============================================================"
echo "  FlavorFind Suggestion Engine — Full Test Suite"
echo "  Started: $(date)"
echo "============================================================"
echo ""
echo "  Launching tests..."
echo "  • Test 1 (coverage)    — local"
echo "  • Test 2 (concurrency) — on droplet via SSH (accurate latency)"
echo "  • Test 3 (quality)     — local"
echo "  Logs → $LOGS_DIR/"
echo ""

# Copy test_2 to droplet and run it there (loopback = no network overhead)
scp -o StrictHostKeyChecking=no \
    scripts/test_2_concurrency.py \
    root@134.209.20.131:/root/test_2_concurrency.py 2>/dev/null

# Launch test_1 and test_3 locally, test_2 on the droplet — all in background
python3 -W ignore scripts/test_1_coverage.py    2>&1 | tee "$LOGS_DIR/test_1_${TIMESTAMP}.log" &
PID1=$!

ssh -o StrictHostKeyChecking=no root@134.209.20.131 \
    "python3 /root/test_2_concurrency.py --local" \
    2>&1 | tee "$LOGS_DIR/test_2_${TIMESTAMP}.log" &
PID2=$!

python3 -W ignore scripts/test_3_quality.py     2>&1 | tee "$LOGS_DIR/test_3_${TIMESTAMP}.log" &
PID3=$!

echo "  PIDs: test_1=$PID1  test_2=$PID2  test_3=$PID3"
echo ""

# Wait for all to complete
wait $PID1; EXIT1=$?
wait $PID2; EXIT2=$?
wait $PID3; EXIT3=$?

echo ""
echo "============================================================"
echo "  COMBINED RESULTS"
echo "============================================================"

# Extract final verdict from each log
for i in 1 2 3; do
    LOG=$(ls "$LOGS_DIR/test_${i}_${TIMESTAMP}.log" 2>/dev/null)
    if [ -f "$LOG" ]; then
        VERDICT=$(grep -E "(PASS|FAIL|verdict)" "$LOG" | tail -5)
        echo ""
        echo "  Test $i:"
        echo "$VERDICT" | sed 's/^/    /'
    fi
done

echo ""
echo "============================================================"

# Exit 0 only if all tests passed
if [ $EXIT1 -eq 0 ] && [ $EXIT2 -eq 0 ] && [ $EXIT3 -eq 0 ]; then
    echo "  ✅  ALL TESTS PASSED"
    echo "============================================================"
    echo ""
    exit 0
else
    echo "  ❌  SOME TESTS FAILED (exit codes: $EXIT1 $EXIT2 $EXIT3)"
    echo "============================================================"
    echo ""
    exit 1
fi
