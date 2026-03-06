#!/bin/bash
# Crash-recovery runner for the Perplexity pipeline.
# Re-runs a step until it completes without error.
# Checkpoint files ensure no work is repeated.
#
# Usage: ./run.sh step1    (or step2, step3, step4, apply)

set -euo pipefail
cd "$(dirname "$0")"

STEP="${1:-step1}"
MAX_RETRIES=10

echo "=== Running $STEP (max $MAX_RETRIES retries) ==="

for i in $(seq 1 $MAX_RETRIES); do
  echo ""
  echo "--- Attempt $i of $MAX_RETRIES ---"

  if npx tsx "${STEP}.ts"; then
    echo ""
    echo "=== $STEP completed successfully ==="
    exit 0
  fi

  echo ""
  echo "Step failed, waiting 30s before retry..."
  sleep 30
done

echo "=== $STEP failed after $MAX_RETRIES attempts ==="
exit 1
