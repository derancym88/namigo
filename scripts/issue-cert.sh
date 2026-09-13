#!/usr/bin/env bash
# First-time Let's Encrypt certificate issue.
#
# nginx cannot start with the real config until a certificate exists, so this
# brings nginx up on plain HTTP, runs certbot through the webroot, then swaps
# the full config back in.
#
#   DOMAIN=amazmaxs.cloud EMAIL=you@example.com bash scripts/issue-cert.sh
set -euo pipefail

DOMAIN="${DOMAIN:?set DOMAIN}"
N8N_DOMAIN="${N8N_DOMAIN:-n8n.${DOMAIN}}"
EMAIL="${EMAIL:?set EMAIL for expiry notices}"
CONF_DIR="docker/nginx/conf.d"

bash scripts/link-env.sh

echo "==> Starting web app and temporary HTTP-only nginx"
docker compose up -d --build namigo-web
mv "${CONF_DIR}/namigo.conf" "${CONF_DIR}/namigo.conf.pending"
cp "${CONF_DIR}/bootstrap.conf.disabled" "${CONF_DIR}/bootstrap.conf"
docker compose up -d namigo-nginx
docker compose restart namigo-nginx

echo "==> Requesting certificate for ${DOMAIN} and ${N8N_DOMAIN}"
docker compose run --rm --entrypoint certbot namigo-certbot \
  certonly --webroot -w /var/www/certbot \
  -d "${DOMAIN}" -d "${N8N_DOMAIN}" \
  --email "${EMAIL}" --agree-tos --no-eff-email --non-interactive

echo "==> Restoring the full TLS config"
rm -f "${CONF_DIR}/bootstrap.conf"
mv "${CONF_DIR}/namigo.conf.pending" "${CONF_DIR}/namigo.conf"
docker compose up -d
docker compose restart namigo-nginx

echo "Certificate installed. Verify with: curl -I https://${DOMAIN}"
