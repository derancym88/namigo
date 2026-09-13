#!/usr/bin/env bash
# Check the environment file before building. Run from /opt/namigo.
set -uo pipefail

cd "$(dirname "$0")/.."
FAIL=0

echo "==> Checking .env.production"
if [ ! -f .env.production ]; then
  echo "  FAIL: .env.production is missing"
  exit 1
fi

perms="$(stat -c '%a' .env.production)"
[ "$perms" = "600" ] || { echo "  WARN: .env.production is mode ${perms}, expected 600"; }

# shellcheck disable=SC1091
set -a; . ./.env.production; set +a

required=(
  NEXT_PUBLIC_APP_URL
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NAMIGO_OWNER_PIN
  NAMIGO_WEBHOOK_SECRET
  NAMIGO_OWNER_LOCKCODE
  NAMIGO_LICENSE_DOMAIN
  NAMIGO_LICENSE_SERVER_IP
  NAMIGO_DEPLOYMENT_IP
  N8N_ENCRYPTION_KEY
)

for key in "${required[@]}"; do
  if [ -z "${!key:-}" ]; then
    echo "  FAIL: ${key} is empty"
    FAIL=1
  fi
done

echo "==> Checking owner protection consistency"
if [ "${NAMIGO_LICENSE_SERVER_IP:-}" != "${NAMIGO_DEPLOYMENT_IP:-}" ]; then
  echo "  FAIL: NAMIGO_LICENSE_SERVER_IP (${NAMIGO_LICENSE_SERVER_IP:-unset}) != NAMIGO_DEPLOYMENT_IP (${NAMIGO_DEPLOYMENT_IP:-unset})"
  echo "        The app would boot straight into locked mode."
  FAIL=1
fi

# The public IP this host actually answers on, for a sanity comparison.
actual="$(curl -fsS --max-time 8 https://api.ipify.org 2>/dev/null || echo '')"
if [ -n "$actual" ] && [ "$actual" != "${NAMIGO_DEPLOYMENT_IP:-}" ]; then
  echo "  WARN: this server's public IP is ${actual} but NAMIGO_DEPLOYMENT_IP is ${NAMIGO_DEPLOYMENT_IP:-unset}"
fi

echo "==> Checking DNS"
for host in "${NAMIGO_LICENSE_DOMAIN:-}" "${N8N_HOST:-}"; do
  [ -n "$host" ] || continue
  resolved="$(getent hosts "$host" | awk '{print $1}' | head -1)"
  if [ -z "$resolved" ]; then
    echo "  FAIL: ${host} does not resolve"
    FAIL=1
  elif [ "$resolved" != "${NAMIGO_DEPLOYMENT_IP:-}" ]; then
    echo "  WARN: ${host} resolves to ${resolved}, not ${NAMIGO_DEPLOYMENT_IP:-unset}"
  else
    echo "  ok: ${host} -> ${resolved}"
  fi
done

echo "==> Checking compose interpolation"
if [ ! -e .env ]; then
  echo "  FAIL: .env is missing - run scripts/link-env.sh"
  FAIL=1
else
  for key in NEXT_PUBLIC_APP_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
    if ! docker compose config 2>/dev/null | grep -q "${key}: .\+"; then
      echo "  FAIL: build arg ${key} resolves empty - the browser bundle would ship without it"
      FAIL=1
    fi
  done
  [ "$FAIL" -eq 0 ] && echo "  ok: NEXT_PUBLIC_* build args resolve"
fi

if [ "$FAIL" -ne 0 ]; then
  echo
  echo "Preflight FAILED - fix the items above before building."
  exit 1
fi

echo
echo "Preflight passed."
