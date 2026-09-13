# Deploying NamiGo X to a fresh VPS

Target server for this rebuild: `118.107.218.216`, SSH port `52436`.

Everything below runs **on your machine or on the server** — the commands are
yours to execute. Work through the phases in order.

---

## Phase 0 — Before you touch the server

| Item | Where it comes from |
|---|---|
| SSH key for the new VPS | Your own machine (`ssh-keygen -t ed25519` if you have none) |
| Supabase anon + service_role keys | Supabase Dashboard → Project Settings → API |
| AI provider keys | Password manager: `NamiGo X / AI Provider Keys` |
| Stripe secret + webhook secret | Password manager: `NamiGo X / Stripe` |
| Owner PIN and owner lockcode | Password manager: `NamiGo X / NamiGo App Owner` |
| n8n encryption key | Password manager: `NamiGo X / n8n` — **or generate a new one** |

> **The server IP changed.** The previous deployment was licensed to
> `157.173.121.122`. Owner protection compares `NAMIGO_LICENSE_SERVER_IP`
> against `NAMIGO_DEPLOYMENT_IP`, so both must be set to `118.107.218.216`
> on this box or the app boots straight into locked mode.

> **Rotate anything that was shared during the old deployment.** Your own
> security guide requires it at handover, and a server migration is a handover.

---

## Phase 1 — Bootstrap the server

```bash
ssh -p 52436 root@118.107.218.216
```

Copy your public key up first if you have not already:

```bash
ssh-copy-id -p 52436 root@118.107.218.216
```

On the server, fetch the code into `/opt/namigo`:

```bash
apt-get update -y && apt-get install -y git

mkdir -p /opt/namigo
cd /opt/namigo

# `git clone` refuses to write into a non-empty directory, and /opt/namigo
# usually already exists (from bootstrap, or an earlier deployment). Init in
# place instead - this works whether the directory is empty or not.
git init
git remote add origin https://github.com/derancym88/namigo
git fetch origin claude/quirky-galileo-0qn08q
git checkout -b claude/quirky-galileo-0qn08q FETCH_HEAD
```

If the repository is private, `git fetch` will prompt for credentials. Use a
personal access token, then revoke it or switch to SSH afterwards:

```bash
git remote set-url origin https://<TOKEN>@github.com/derancym88/namigo
```

Confirm the checkout landed before continuing:

```bash
ls                    # Dockerfile, docker-compose.yml, src/, scripts/, supabase/
git log --oneline -1
```

Now bootstrap the host:

```bash
SSH_PORT=52436 bash scripts/bootstrap-vps.sh
```

This installs Docker Engine + Compose, opens only ports `52436`, `80` and
`443` in ufw, disables SSH password login, and enables fail2ban.

**Keep your current SSH session open** and confirm key login works in a second
terminal before closing it — the script disables password authentication.

---

## Phase 2 — DNS

Point both records at the new server, then wait for propagation:

| Type | Name | Value |
|---|---|---|
| A | `amazmaxs.cloud` | `118.107.218.216` |
| A | `n8n.amazmaxs.cloud` | `118.107.218.216` |

Verify before continuing — certificate issue fails otherwise:

```bash
dig +short amazmaxs.cloud
dig +short n8n.amazmaxs.cloud
```

---

## Phase 3 — Environment file

```bash
cd /opt/namigo
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Fill in every blank value. Generate the secrets that have no prior value:

```bash
openssl rand -hex 32   # NAMIGO_WEBHOOK_SECRET
openssl rand -hex 32   # N8N_ENCRYPTION_KEY  (back this up - losing it destroys n8n credentials)
openssl rand -base64 24 # NAMIGO_OWNER_LOCKCODE, if rotating
```

Confirm these three lines carry the **new** IP:

```
NAMIGO_LICENSE_SERVER_IP=118.107.218.216
NAMIGO_DEPLOYMENT_IP=118.107.218.216
NAMIGO_LICENSE_DOMAIN=amazmaxs.cloud
```

---

## Phase 4 — Render nginx and issue the certificate

```bash
cd /opt/namigo
DOMAIN=amazmaxs.cloud N8N_DOMAIN=n8n.amazmaxs.cloud bash scripts/render-nginx.sh
DOMAIN=amazmaxs.cloud EMAIL=quest988@gmail.com bash scripts/issue-cert.sh
```

`issue-cert.sh` starts nginx on plain HTTP, runs certbot through the webroot,
then swaps the full TLS config back in. Certbot renews automatically twice a
day from the `namigo-certbot` container.

---

## Phase 5 — Bring the stack up

```bash
cd /opt/namigo
docker compose up -d --build
docker compose ps
```

Expect four running containers: `namigo-web`, `namigo-nginx`, `namigo-n8n`,
`namigo-certbot`.

```bash
curl -I https://amazmaxs.cloud
curl -s https://amazmaxs.cloud/api/health
```

---

## Phase 6 — Supabase

Apply the migrations in order (SQL Editor in the Supabase dashboard, or the
Supabase CLI):

1. `supabase/migrations/0001_namigo_core.sql`
2. `supabase/migrations/0002_subscription_feature_flags.sql`
3. `supabase/migrations/0003_demo_passcodes.sql`

Create the storage buckets:

| Bucket | Visibility |
|---|---|
| `product-images` | public |
| `generated-images` | public |
| `launch-kits` | private |

Enable email/password auth, add `https://amazmaxs.cloud` to the redirect URL
allow-list, then grant yourself admin:

```sql
insert into public.admin_settings (user_id, role)
values ('83941736-0886-44de-995b-f1311333b380', 'owner')
on conflict (user_id) do nothing;
```

Record ownership for audit:

```sql
insert into public.ownership_control
  (id, owner_company, product_name, license_id, license_domain, license_server_ip)
values
  ('primary', 'AMAZ MAXS ENTERPRISE', 'NamiGo X', 'NGX-AMZMAXS-2026-PROD',
   'amazmaxs.cloud', '118.107.218.216')
on conflict (id) do update set
  license_server_ip = excluded.license_server_ip,
  updated_at = now();
```

---

## Phase 7 — n8n

1. Open `https://n8n.amazmaxs.cloud` and complete the owner account setup.
2. Import workflows WF-01 … WF-12.
3. Connect credentials: Gemini, DeepSeek, fal.ai, and the Supabase Postgres
   connection.
4. Point each workflow's callback at `https://amazmaxs.cloud/api/n8n/webhook`,
   sending the `x-namigo-secret` header with your `NAMIGO_WEBHOOK_SECRET`.
5. Activate a workflow only after a manual test call passes.

**WF-06 routing:** n8n registered image generation under the slug
`cAO50daJszSqaem6/webhookimagegen/image-generate`, not a plain
`image-generate`. That exact string lives in `src/lib/workflow.ts`. If you
rebuild or reimport WF-06 and its registered path changes, update it there.

**WF-07 needs a valid `FAL_KEY`.** Video generation was blocked on the old
deployment for exactly this reason — verify the key before selling video kits.

---

## Phase 8 — Verify before accepting customer work

```bash
curl -s https://amazmaxs.cloud/api/health
```

Then, in a browser:

- [ ] Homepage loads over HTTPS
- [ ] `/owner-lock` accepts the lockcode and redirects to `/`
- [ ] `/register` and `/login` work
- [ ] `/admin` generates a passcode
- [ ] `/jobs/new` accepts that passcode and creates a kit
- [ ] `POST /api/jobs` **without** a passcode is rejected
- [ ] Each workflow stage runs and writes results back to the job page
- [ ] `https://n8n.amazmaxs.cloud` reachable
- [ ] Stripe test checkout completes before switching to live keys

---

## Routine operations

```bash
cd /opt/namigo

docker compose ps                        # container status
docker compose logs -f namigo-web        # app logs
docker compose logs -f namigo-nginx      # proxy logs
docker compose up -d --build namigo-web  # redeploy the app only
docker compose up -d                     # restart everything
bash scripts/backup.sh                   # back up n8n + app data + env
```

Deploy updated code from your laptop:

```bash
VPS_HOST=118.107.218.216 VPS_PORT=52436 bash scripts/deploy.sh
```

### Locked out of the app

```bash
ssh -p 52436 root@118.107.218.216
cd /opt/namigo
grep -E 'NAMIGO_(OWNER_LOCKCODE|LICENSE_DOMAIN|LICENSE_SERVER_IP|DEPLOYMENT_IP)' .env.production
# confirm the IPs match 118.107.218.216 and each other, then:
docker compose up -d --build namigo-web
```

Emergency disable: set `NAMIGO_OWNER_PROTECTION=disabled`, restart
`namigo-web`, and re-enable once access is restored.

### Stop demo-kit creation immediately

Rotate `NAMIGO_OWNER_PIN`, restart `namigo-web`, and revoke active passcodes
in `public.demo_passcodes`.
