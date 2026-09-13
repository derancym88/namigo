# NamiGo X

AI e-commerce launch-kit production engine.
Owner: AMAZ MAXS ENTERPRISE, trading as NamiGo AI Production Division.

One raw product photo becomes a complete commercial launch kit: market
insight, conversion copy, 4K product visuals and a cinematic promo video.

## Stack

| Service | Role |
|---|---|
| `namigo-web` | Next.js 14 App Router application |
| `namigo-nginx` | Reverse proxy, TLS termination |
| `namigo-n8n` | Workflow orchestration (WF-01 … WF-12) |
| `namigo-certbot` | Let's Encrypt issue and renewal |
| Supabase | Postgres, auth, storage, row-level security |

## The six-stage production chain

This sequence is the product — the UI, database and n8n workflows all key off
these step numbers (`src/lib/workflow.ts`):

1. Product image ingestion (WF-03)
2. Market and content research (WF-04)
3. Copy matching (WF-05)
4. Image generation (WF-06)
5. Video generation (WF-07)
6. Launch kit export (WF-08)

## Routes

| Path | Purpose |
|---|---|
| `/` | Public landing page |
| `/pricing` | Packages and credit economy |
| `/register`, `/login` | Customer auth |
| `/dashboard` | Customer kit list |
| `/jobs/new` | Intake console — requires a demo-kit passcode |
| `/jobs/[id]` | Production run screen |
| `/admin` | Operator console, passcode generation |
| `/owner-lock` | Owner unlock for protected deployments |

### API

| Endpoint | Purpose |
|---|---|
| `POST /api/jobs` | Create a job — **rejects calls without a valid passcode** |
| `POST /api/jobs/[id]/trigger` | Dispatch one stage to n8n |
| `POST /api/n8n/webhook` | Receive stage results (shared-secret auth) |
| `POST /api/admin/demo-passcodes` | Generate a passcode |
| `POST /api/webhooks/stripe` | Stripe events (signature auth) |
| `GET /api/health` | Liveness probe |

## Access control

Three layers, as specified in the manual:

- **Visitor** — homepage and pricing; cannot create kits.
- **Customer** — creates kits after auth, still gated by passcode in demo
  mode; scoped by Supabase row-level security in production.
- **Admin** — `/admin`. Authorised by a Supabase session listed in
  `public.admin_settings`, or by `NAMIGO_OWNER_PIN` while the app runs
  without Supabase.

Passcodes are `NGX-XXXX-XXXX-XXXX`. **Only SHA-256 hashes are stored**; the
plaintext is shown to the operator exactly once at generation.

### Owner protection

Middleware blocks every protected route unless a signed 12-hour unlock cookie
is present. The licence check requires the request host to match
`NAMIGO_LICENSE_DOMAIN` **and** `NAMIGO_LICENSE_SERVER_IP` to equal
`NAMIGO_DEPLOYMENT_IP`, so a copy lifted onto another host stays locked.
Stripe and n8n webhooks are exempt — they carry their own authentication.

This is a deterrent and an ownership watermark, not a substitute for legal IP
protection.

## Storage modes

The app runs in one of two modes, chosen automatically by whether Supabase
keys are present:

- **Supabase mode** (production) — Postgres tables and Supabase Storage.
- **Temporary mode** (VPS smoke tests only) — JSON files under `/app-data`.

Never run paid customer work in temporary mode.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values; keep production keys out
npm run dev
npm run typecheck
npm run build
```

## Deployment

See **[DEPLOY.md](DEPLOY.md)** for the full fresh-VPS procedure.

```bash
VPS_HOST=118.107.218.216 VPS_PORT=52436 bash scripts/deploy.sh
```

## Secrets

No real secret belongs in this repository. `.env.production` lives only on the
server at `/opt/namigo/.env.production`, mode `600`. Real values live in the
password manager under the `NamiGo X` folder. Rotate anything that was ever
pasted into chat, email or a screenshot.

## Documentation

- [`docs/NAMIGO_X_FULL_MANUAL_BIBLE.md`](docs/NAMIGO_X_FULL_MANUAL_BIBLE.md)
- [`docs/NAMIGO_ENGINE_BLUEPRINT.md`](docs/NAMIGO_ENGINE_BLUEPRINT.md)
- [`docs/SECURITY_ACCESS_CONTROL_GUIDE.md`](docs/SECURITY_ACCESS_CONTROL_GUIDE.md)
