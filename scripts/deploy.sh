#!/usr/bin/env bash
# Deploy the current checkout to the VPS and rebuild the stack.
#
#   VPS_HOST=118.107.218.216 VPS_PORT=52436 bash scripts/deploy.sh
#
# Uses rsync over SSH; .env.production on the server is never overwritten.
set -euo pipefail

VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:?set VPS_HOST}"
VPS_PORT="${VPS_PORT:-52436}"
APP_DIR="${APP_DIR:-/opt/namigo}"

SSH="ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}"

echo "==> Syncing source to ${VPS_HOST}:${APP_DIR}"
rsync -az --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'app-data/' \
  --exclude 'certbot/' \
  --exclude '.env.production' \
  --exclude '.env.local' \
  -e "ssh -p ${VPS_PORT}" \
  ./ "${VPS_USER}@${VPS_HOST}:${APP_DIR}/"

echo "==> Stamping build fingerprint"
FINGERPRINT="NGX-$(git rev-parse --short=16 HEAD 2>/dev/null | tr 'a-z' 'A-Z' || date +%s)"
# shellcheck disable=SC2029
$SSH "cd ${APP_DIR} && \
  if grep -q '^NAMIGO_BUILD_FINGERPRINT=' .env.production; then \
    sed -i 's|^NAMIGO_BUILD_FINGERPRINT=.*|NAMIGO_BUILD_FINGERPRINT=${FINGERPRINT}|' .env.production; \
  else \
    echo 'NAMIGO_BUILD_FINGERPRINT=${FINGERPRINT}' >> .env.production; \
  fi"

echo "==> Rebuilding containers"
# shellcheck disable=SC2029
$SSH "cd ${APP_DIR} && docker compose up -d --build && docker compose ps"

echo "==> Health check"
# shellcheck disable=SC2029
$SSH "curl -fsS http://127.0.0.1:80/api/health -H 'Host: \$(grep '^NAMIGO_LICENSE_DOMAIN=' ${APP_DIR}/.env.production | cut -d= -f2)' || echo 'health check did not pass - inspect docker compose logs'"

echo "Deploy finished. Build: ${FINGERPRINT}"
