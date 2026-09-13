#!/usr/bin/env bash
# Prepare a fresh Ubuntu/Debian VPS to host NamiGo X.
# Run once, as root, on the new server:
#   bash scripts/bootstrap-vps.sh
set -euo pipefail

SSH_PORT="${SSH_PORT:-52436}"
APP_DIR="${APP_DIR:-/opt/namigo}"

echo "==> Updating base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw fail2ban

echo "==> Installing Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "==> Firewall: allow SSH on ${SSH_PORT}, HTTP and HTTPS only"
ufw allow "${SSH_PORT}"/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Hardening sshd (key auth, no root password login)"
# Keep a copy so a bad edit can be rolled back.
cp -n /etc/ssh/sshd_config /etc/ssh/sshd_config.namigo.bak || true
sed -i "s/^#\?Port .*/Port ${SSH_PORT}/" /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
echo "    NOTE: confirm your SSH key works in a SECOND session before closing this one."
systemctl restart ssh || systemctl restart sshd

echo "==> Creating ${APP_DIR}"
mkdir -p "${APP_DIR}"/{certbot/conf,certbot/www}
chmod 750 "${APP_DIR}"

systemctl enable --now fail2ban

cat <<'NEXT'

Bootstrap complete.

Next:
  1. Copy the repository into /opt/namigo (git clone, or scripts/deploy.sh from your laptop).
  2. Create /opt/namigo/.env.production from .env.production.example and chmod 600 it.
  3. Point DNS A records for your domain and n8n subdomain at this server.
  4. Run scripts/issue-cert.sh to obtain the TLS certificate.
  5. Run docker compose up -d --build.
NEXT
