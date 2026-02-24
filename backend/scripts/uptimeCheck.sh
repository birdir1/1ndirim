#!/usr/bin/env bash

set -euo pipefail

CHECKS=(
  "landing|https://1ndirim.birdir1.com/"
  "api_health|https://api.1ndirim.birdir1.com/api/health"
  "admin|https://admin.1ndirim.birdir1.com/"
)

PASS=0
FAIL=0
TS="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

for item in "${CHECKS[@]}"; do
  name="${item%%|*}"
  url="${item#*|}"
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$url" || true)"
  if [[ "$code" == "200" ]]; then
    echo "[$TS] [PASS] $name $url ($code)"
    PASS=$((PASS + 1))
  else
    echo "[$TS] [FAIL] $name $url (got: $code, expected: 200)"
    FAIL=$((FAIL + 1))
  fi
done

echo "[$TS] Summary: PASS=$PASS FAIL=$FAIL"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
