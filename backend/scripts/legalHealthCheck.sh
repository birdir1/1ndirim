#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${LEGAL_BASE_URL:-https://1ndirim.birdir1.com}"
PATHS=("/privacy-policy" "/terms-of-use")

PASS=0
FAIL=0

for path in "${PATHS[@]}"; do
  url="${BASE_URL}${path}"
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$url" || true)"
  if [[ "$code" == "200" ]]; then
    echo "[PASS] $url ($code)"
    PASS=$((PASS + 1))
  else
    echo "[FAIL] $url (got: $code, expected: 200)"
    FAIL=$((FAIL + 1))
  fi
done

echo "Summary: PASS=$PASS FAIL=$FAIL"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

