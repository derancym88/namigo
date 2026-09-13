#!/usr/bin/env bash
# Substitute the real domain names into the nginx config.
#   DOMAIN=amazmaxs.cloud N8N_DOMAIN=n8n.amazmaxs.cloud bash scripts/render-nginx.sh
set -euo pipefail

DOMAIN="${DOMAIN:?set DOMAIN, e.g. amazmaxs.cloud}"
N8N_DOMAIN="${N8N_DOMAIN:-n8n.${DOMAIN}}"
CONF="docker/nginx/conf.d/namigo.conf"

[ -f "$CONF" ] || { echo "missing $CONF - run from the repo root"; exit 1; }

sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g; s/N8N_DOMAIN_PLACEHOLDER/${N8N_DOMAIN}/g" "$CONF"
echo "nginx config rendered for ${DOMAIN} and ${N8N_DOMAIN}"
