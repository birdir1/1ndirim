#!/usr/bin/env bash

set -euo pipefail

THRESHOLD_DAYS="${SSL_ALERT_DAYS:-21}"
EXPECTED_IP="${EXPECTED_IP:-37.140.242.105}"
HOSTS=(
  "1ndirim.birdir1.com"
  "api.1ndirim.birdir1.com"
  "admin.1ndirim.birdir1.com"
)

PASS=0
FAIL=0
NOW_EPOCH="$(date +%s)"

check_dns() {
  local host="$1"
  local ips
  ips="$(dig +short "$host" A | tr '\n' ' ' | sed 's/[[:space:]]\+$//')"
  if [[ -z "$ips" ]]; then
    echo "[FAIL] DNS $host resolved empty"
    FAIL=$((FAIL + 1))
    return
  fi
  if [[ "$ips" == *"$EXPECTED_IP"* ]]; then
    echo "[PASS] DNS $host -> $ips"
    PASS=$((PASS + 1))
  else
    echo "[FAIL] DNS $host -> $ips (expected include $EXPECTED_IP)"
    FAIL=$((FAIL + 1))
  fi
}

check_ssl_expiry() {
  local host="$1"
  local cert_end
  cert_end="$(
    echo | openssl s_client -servername "$host" -connect "${host}:443" 2>/dev/null \
      | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2
  )"
  if [[ -z "$cert_end" ]]; then
    echo "[FAIL] SSL $host certificate end date could not be read"
    FAIL=$((FAIL + 1))
    return
  fi

  local cert_epoch
  cert_epoch="$(date -j -f '%b %e %T %Y %Z' "$cert_end" '+%s' 2>/dev/null || true)"
  if [[ -z "$cert_epoch" ]]; then
    cert_epoch="$(date -d "$cert_end" '+%s' 2>/dev/null || true)"
  fi
  if [[ -z "$cert_epoch" ]]; then
    echo "[FAIL] SSL $host could not parse cert date: $cert_end"
    FAIL=$((FAIL + 1))
    return
  fi

  local remain_days
  remain_days="$(( (cert_epoch - NOW_EPOCH) / 86400 ))"
  if (( remain_days < THRESHOLD_DAYS )); then
    echo "[FAIL] SSL $host expires in ${remain_days} days (< ${THRESHOLD_DAYS})"
    FAIL=$((FAIL + 1))
  else
    echo "[PASS] SSL $host expires in ${remain_days} days"
    PASS=$((PASS + 1))
  fi
}

for host in "${HOSTS[@]}"; do
  check_dns "$host"
  check_ssl_expiry "$host"
done

echo "Summary: PASS=$PASS FAIL=$FAIL"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

