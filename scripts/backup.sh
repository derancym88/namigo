#!/usr/bin/env bash
# Back up the n8n data volume, app data and the environment file.
# Run on the VPS:  bash scripts/backup.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/namigo}"
DEST="${DEST:-/opt/namigo-backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "${DEST}"
chmod 700 "${DEST}"

echo "==> Dumping Docker volumes"
docker run --rm \
  -v namigo_namigo-n8n-data:/data:ro \
  -v "${DEST}":/backup alpine \
  tar czf "/backup/n8n-${STAMP}.tar.gz" -C /data .

docker run --rm \
  -v namigo_namigo-app-data:/data:ro \
  -v "${DEST}":/backup alpine \
  tar czf "/backup/app-data-${STAMP}.tar.gz" -C /data .

echo "==> Copying environment file (contains secrets - keep this directory private)"
cp "${APP_DIR}/.env.production" "${DEST}/env-production-${STAMP}.bak"
chmod 600 "${DEST}"/*

echo "==> Pruning backups older than 30 days"
find "${DEST}" -type f -mtime +30 -delete

echo "Backup written to ${DEST} (stamp ${STAMP})"
