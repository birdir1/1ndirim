#!/usr/bin/env bash

set -euo pipefail

PASS_COUNT=0
FAIL_COUNT=0

check_status() {
  local url="$1"
  local expected="$2"
  local label="$3"

  local status
  status="$(curl -sS -o /dev/null -w '%{http_code}' -I "$url" || true)"

  if [[ "$status" == "$expected" ]]; then
    echo "[PASS] $label -> $url ($status)"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "[FAIL] $label -> $url (got: $status, expected: $expected)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

check_redirect() {
  local url="$1"
  local expected_status="$2"
  local expected_location_fragment="$3"
  local label="$4"

  local headers
  headers="$(curl -sS -I "$url" || true)"
  local status
  status="$(printf '%s\n' "$headers" | awk '/^HTTP/{code=$2} END{print code}')"
  local location
  location="$(printf '%s\n' "$headers" | awk 'BEGIN{IGNORECASE=1} /^Location:/{print $2}' | tr -d '\r')"

  if [[ "$status" == "$expected_status" && "$location" == *"$expected_location_fragment"* ]]; then
    echo "[PASS] $label -> $url ($status => $location)"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "[FAIL] $label -> $url (status: $status, location: $location)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

echo "Running domain smoke tests..."

check_status "https://1ndirim.birdir1.com/" "200" "Canonical landing"
check_status "https://api.1ndirim.birdir1.com/api/health" "200" "Canonical API health"
check_status "https://admin.1ndirim.birdir1.com/" "200" "Canonical admin"

check_redirect "https://1indirim.birdir1.com/" "301" "1ndirim.birdir1.com" "Legacy landing redirects"
check_redirect "https://api.1indirim.birdir1.com/" "301" "api.1ndirim.birdir1.com" "Legacy API redirects"
check_redirect "https://admin.1indirim.birdir1.com/" "301" "admin.1ndirim.birdir1.com" "Legacy admin redirects"

echo
echo "Summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi

