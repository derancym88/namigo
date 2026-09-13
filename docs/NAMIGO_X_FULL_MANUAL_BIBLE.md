# NamiGo X Full Manual Bible

Version: 2026-05-06
Owner company: AMAZ MAXS ENTERPRISE, trading as NamiGo AI Production Division
Live app: https://amazmaxs.cloud
n8n console: https://n8n.amazmaxs.cloud

## 1. Business Context

NamiGo X is an AI SaaS application for e-commerce launch-kit production. The app is owned by AMAZ MAXS ENTERPRISE / NamiGo AI Production Division.

First customer record:

- Customer: Jajan Viral Whole Sales Sdn Bhd.
- Attention: Mr. Steven
- Invoice: 260422-001
- Date: 22 April 2026
- Package: NamiGo X Business Allocation Package
- Allocation: 120 standard AI launch kits
- Included output per kit: market insight, TikTok-optimised copywriting, 4 x 4K product visuals, 10-second cinematic video, digital export/download
- Subscription validity: 90 days from activation
- Invoice total: RM 4,500.00
- Payment terms: due 7 May 2026, bank transfer/online banking

## 2. Live System Map

The current production deployment runs on a VPS with Docker Compose.

- `namigo-web`: Next.js SaaS web application
- `namigo-nginx`: public reverse proxy and SSL entrypoint
- `namigo-n8n`: n8n workflow automation service
- Main domain: `amazmaxs.cloud`
- n8n subdomain: `n8n.amazmaxs.cloud`
- SSL: Let's Encrypt via nginx/certbot volume

Core routes:

- `/`: public landing page
- `/owner-lock`: private owner unlock page for protected deployments
- `/pricing`: subscription and credit packages
- `/register`: user registration
- `/login`: user login
- `/dashboard`: customer dashboard
- `/jobs/new`: create launch/demo kit
- `/jobs/[id]`: workflow run screen
- `/admin`: operator/admin readiness, feature controls, and demo-kit passcode generation

## 3. Access Control Model

There are three access layers.

Layer 1: Public visitor

- Can view homepage and pricing.
- Can register or log in.
- Cannot create a demo kit unless they have a valid demo-kit passcode.

Layer 2: Customer/user

- Can create launch jobs after authentication.
- In current test mode, users can create demo jobs only with a valid passcode.
- In production Supabase mode, each job is tied to a Supabase user ID and protected by row-level security.

Layer 3: Admin/operator

- Uses `/admin`.
- Can manage subscription feature flags.
- Can generate demo-kit passcodes.
- In temporary no-Supabase mode, passcode generation requires `NAMIGO_OWNER_PIN`.
- In production Supabase mode, admin functions require a logged-in user listed in `public.admin_settings`.

## 4. Demo-Kit Passcode Control

Purpose: prevent random users from creating demo kits while still letting the owner/team issue controlled access to selected customers or testers.

Current live behavior:

- Admin opens `/admin`.
- Admin enters owner PIN in the Demo-kit passcode control section.
- Admin generates a passcode with:
  - label
  - max uses
  - expiry days
- Admin gives the generated passcode to a customer/tester.
- Customer opens `/jobs/new`, enters the passcode, uploads product image, and creates the kit.
- Direct API calls to `/api/jobs` without a passcode are rejected.

Security properties:

- Passcodes are generated as `NGX-XXXX-XXXX-XXXX`.
- The server stores only SHA-256 hashes of passcodes.
- Each passcode has expiry and usage limits.
- Used passcodes increment `uses_count`.
- Expired, revoked, or fully used passcodes cannot create new kits.

Temporary server-store path:

- `/app-data/namigo-demo-passcodes.json`

Temporary demo-upload path:

- `/app-data/uploads`

Production Supabase table:

- `public.demo_passcodes`

Production migration:

- `supabase/migrations/0003_demo_passcodes.sql`

Important: after Supabase production is connected, use database-backed passcodes only. The temporary server file is for current VPS test mode.

## 5. Customer Operation Flow

Use this flow for Jajan Viral or any new customer.

1. Confirm payment and package allocation.
2. Create customer account or ask customer to register at `/register`.
3. Generate demo-kit or activation passcode in `/admin`.
4. Send passcode to customer/team member.
5. Customer opens `/jobs/new`.
6. Customer enters passcode, product category, and product image.
7. Customer opens generated job screen.
8. NamiGo auto-runs workflow steps in order:
   - Step 1: image ingestion
   - Step 2: market research
   - Step 3: copy matching
   - Step 4: image generation
   - Step 5: video generation
   - Step 6: launch kit export
9. Operator checks all outputs before delivery.
10. Deduct kit/credit usage from customer allocation once production billing is connected.

## 6. Team Daily Checklist

Before accepting customer work:

- Open https://amazmaxs.cloud and confirm homepage loads.
- Open `/login` and `/register` and confirm forms render.
- Open `/admin` and confirm the admin panel loads.
- Generate a test passcode.
- Create a test kit from `/jobs/new`.
- Run each visible workflow step.
- Confirm n8n is reachable at https://n8n.amazmaxs.cloud.
- Confirm provider API keys are loaded in server/n8n environment.
- Check Stripe/Supabase mode before charging real customers.

Do not accept paid live generation if:

- Supabase project keys are missing.
- Stripe live price IDs are missing.
- AI provider keys are missing.
- n8n workflows are inactive or not imported.
- End-to-end test has not passed for the exact package being sold.

## 7. Developer Setup

Local commands:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

Environment files:

- `.env.example`: local development reference
- `.env.production.example`: production reference
- `.env.production`: real production secrets on VPS only

Required production variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NAMIGO_OWNER_PIN`
- `NAMIGO_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe price IDs
- AI provider keys such as `FAL_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `QWEN_API_KEY`
- n8n variables such as `N8N_HOST`, `N8N_EDITOR_BASE_URL`, `N8N_WEBHOOK_PUBLIC_URL`, `N8N_ENCRYPTION_KEY`

Credential storage rule:

- Do not write raw passwords, service-role keys, Stripe secrets, provider API keys, or VPS credentials into this manual.
- Store the real values in the owner's password manager under `NamiGo X / Production Secrets`.
- Store only masked hints, locations, and recovery steps in this manual.
- Rotate any secret that was pasted into chat, screenshots, email, or shared documents.

## 8. Supabase Build Manual

Current project setup record:

- Supabase organization: `quest988-Samm's Org`
- Supabase project name: `Namigo X`
- Supabase project ID: `fxiaicfznwmgugypxjlh`
- Supabase project URL: `https://fxiaicfznwmgugypxjlh.supabase.co`
- Project creation date: `2026-05-06`
- Selected region: `Asia-Pacific`
- Data API: enabled
- Database password: stored in password manager only, item `NamiGo X / Supabase / Database password`
- Database password hint: [REDACTED - see password manager]

Required Supabase values after the project is created:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard -> Project Settings -> API -> Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard -> Project Settings -> API -> anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard -> Project Settings -> API -> service_role secret key
- Direct database host/user/password: Supabase Dashboard -> Project Settings -> Database -> Connection string

Current Supabase key status:

- Publishable/anon key: received on `2026-05-06`; stored in VPS env only.
- Secret/service-role key: received on `2026-05-06`; stored in VPS env only.
- Migrations `0001` to `0003` applied successfully.
- Production storage buckets created: `product-images`, `generated-images`, `launch-kits`.

Important handling notes:

- The `anon` key can be used by the browser but should still be treated carefully.
- The `service_role` key bypasses row-level security and must stay server-side only.
- The database password must be percent-encoded when placed inside a Postgres URL if it contains symbols.
- n8n needs a Postgres credential or connection string that points to this Supabase database before WF-01 to WF-12 can run real production data.

Apply migrations in order:

1. `supabase/migrations/0001_namigo_core.sql`
2. `supabase/migrations/0002_subscription_feature_flags.sql`
3. `supabase/migrations/0003_demo_passcodes.sql`

Required storage buckets:

- `product-images`: public
- `generated-images`: public
- `launch-kits`: private

Admin enablement:

- Create a Supabase user for the owner/admin.
- Insert that user ID into `public.admin_settings`.
- Verify `/admin` save/generate actions work while logged in.

Current owner/admin record:

- Owner email: `quest988@gmail.com`
- Owner Supabase user ID: `83941736-0886-44de-995b-f1311333b380`
- Admin role: `owner`
- Login password: stored in password manager item `NamiGo X / Supabase / Owner login`
- Security note: rotate the owner password after final handover because setup credentials were shared during deployment.

Authentication:

- Email/password must be enabled.
- Google OAuth can be enabled for Gmail login.
- Yahoo users use standard email/password registration with their Yahoo address.

## 9. n8n Build Manual

n8n is the workflow automation engine.

Expected workflow set:

- WF-01 to WF-12
- WF-07 should use fal.ai instead of Kling AI for video generation.

Required n8n env:

- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`
- `QWEN_API_KEY`
- `FAL_KEY`
- `NAMIGO_WEBHOOK_SECRET`
- `NAMIGO_APP_URL`
- `N8N_BASE_URL`

Testing a workflow:

1. Open n8n.
2. Confirm workflows are imported.
3. Confirm credentials are connected.
4. Activate workflows only after test calls pass.
5. Trigger one demo kit from the web app.
6. Confirm n8n receives the webhook.
7. Confirm output returns to NamiGo job page.

Current production workflow test status, `2026-05-06`:

- WF-03 / Step 1 Product Image Ingestion: real Supabase job tested and passing with Gemini.
- WF-04 / Step 2 Market Research: real Supabase job tested and passing with DeepSeek.
- WF-05 / Step 3 Copy Matching: real Supabase job tested and passing with DeepSeek. Qwen key was rejected by provider, so WF-05 was switched away from Qwen.
- WF-06 / Step 4 Image Generation: real Supabase job tested and passing with Gemini Imagen 4. It generated 4 product images and wrote them to `jobs.image_urls`.
- WF-07 / Step 5 Video Generation: blocked until a valid `FAL_KEY` is added to production env.
- WF-08 / Step 6 Export: not declared final until Step 5 has a real video asset or an approved no-video fallback mode.

Important WF-06 routing note:

- n8n registered WF-06 under `cAO50daJszSqaem6/webhookimagegen/image-generate`, not the plain `image-generate` path.
- The web app `workflowSteps` config must keep this exact slug unless WF-06 is rebuilt/reimported with a different registered webhook.

## 10. Stripe / Monetization Manual

Current package model:

- 1 credit = RM5
- Trial: 3 credits/demo images
- Starter: RM550, 110 credits, about 10 launch kits
- Professional: RM2500, 550 credits, about 50 launch kits
- Business: RM4500, 1100 credits, about 100 launch kits
- Diamond VIP: RM15000/month, 3500 credits, human QC, private prompt tuning, 500GB

Before live charging:

- Create products and prices in Stripe.
- Put live price IDs into `.env.production`.
- Configure webhook endpoint:
  - `https://amazmaxs.cloud/api/webhooks/stripe`
- Store webhook secret in `STRIPE_WEBHOOK_SECRET`.
- Run Stripe test checkout first.
- Switch to live keys only after successful test.

## 11. Deployment Manual

Package locally:

```bash
python .\tools\package_deploy.py
```

Deploy to VPS:

```bash
python .\tools\server_update_web_app.py
```

Check containers:

```bash
docker compose ps
```

Restart web app:

```bash
cd /opt/namigo
docker compose up -d --build namigo-web
```

Restart all services:

```bash
cd /opt/namigo
docker compose up -d
```

Check public response:

```bash
curl -I https://amazmaxs.cloud
```

## 12. Bug Fixing Manual

If homepage is down:

1. SSH into VPS.
2. Run `docker compose ps`.
3. Check nginx logs.
4. Check web logs.
5. Rebuild `namigo-web`.
6. Confirm SSL certificate is still valid.

If login/register fails:

1. Check Supabase URL and anon key.
2. Confirm Supabase Auth providers are enabled.
3. Confirm redirect URLs include `https://amazmaxs.cloud`.
4. Check browser console.
5. Run `npm run typecheck` and `npm run build`.

If passcode generation fails:

1. Confirm `NAMIGO_OWNER_PIN` exists in production env.
2. Confirm `/admin` is loading latest deployment.
3. Confirm API `/api/admin/demo-passcodes` is reachable.
4. In Supabase mode, confirm the logged-in user exists in `admin_settings`.
5. In temporary mode, confirm `/tmp/namigo-demo-passcodes.json` is writable by the app container.

Known live test passcode:

- Production Supabase-mode smoke test passcode: `[REDACTED - see password manager]`
- Created: `2026-05-06`
- Max uses: `25`
- Expiry: `30 days from creation`
- Purpose: internal production pipeline testing only.

If kit creation fails:

1. Confirm passcode is active.
2. Confirm passcode has remaining uses.
3. Confirm passcode is not expired.
4. Confirm uploaded image is PNG/JPEG.
5. Check `/api/jobs` response.
6. Check web container logs.

If n8n workflow fails:

1. Open n8n execution logs.
2. Confirm workflow is active.
3. Confirm provider API key exists.
4. Confirm webhook secret matches.
5. Test the provider node alone.
6. Retry with a known good product image.

## 13. Security Rules

- Never paste VPS, Hostinger, Supabase service role, Stripe secret, or provider API keys into public chats, docs, or customer messages.
- Rotate any credential that was shared outside a password manager.
- Use `docs/NAMIGO_X_ACCESS_LOGIN_CHECKLIST.md` as the master checklist for connected accounts, login locations, reset paths, and password-manager item names.
- Use different passwords/PINs for Hostinger, VPS, n8n, Supabase, and app owner PIN.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Keep `NAMIGO_OWNER_PIN` server-side only.
- Use HTTPS only.
- Use Supabase RLS for customer data isolation.
- Keep n8n credentials inside n8n/server environment only.
- Disable demo/test passcodes after testing.

## 14. Owner Protection System

NamiGo X includes an owner protection layer designed to reduce casual copying, unauthorized rehosting, and false ownership claims.

Live owner protection status:

- Owner protection: enabled
- Owner unlock page: `/owner-lock`
- Owner company: `AMAZ MAXS ENTERPRISE`
- Product: `NamiGo X`
- License ID: `NGX-AMZMAXS-2026-PROD`
- Licensed domain: `amazmaxs.cloud`
- Licensed server IP: `157.173.121.122`
- Current build fingerprint: `NGX-12DFA8CAA3CCEFCB`
- Supabase ownership table: `public.ownership_control`
- Primary ownership record: `id = primary`

How it works:

1. Middleware blocks all protected app routes unless the owner unlock cookie is present.
2. `/owner-lock` accepts `NAMIGO_OWNER_LOCKCODE`.
3. The lockcode is checked server-side only.
4. A signed unlock cookie is created for 12 hours.
5. Domain and deployment IP are checked against license env values.
6. If the app is copied to a different domain or configured deployment IP, it enters locked mode.
7. App HTML and responses carry ownership/build watermark metadata.
8. Supabase stores an ownership record for audit and proof of control.

Production env variables:

- `NAMIGO_OWNER_PROTECTION=enabled`
- `NAMIGO_OWNER_LOCKCODE`
- `NAMIGO_OWNER_USER_ID`
- `NAMIGO_OWNER_COMPANY`
- `NAMIGO_PRODUCT_NAME`
- `NAMIGO_LICENSE_ID`
- `NAMIGO_LICENSE_DOMAIN`
- `NAMIGO_LICENSE_SERVER_IP`
- `NAMIGO_DEPLOYMENT_IP`

Current lockcode note:

- The first deployed owner lockcode used the existing server-side owner PIN value so the owner was not locked out.
- Rotated after unlock confirmation on `2026-05-06`.
- Store it in password manager item `NamiGo X / NamiGo App Owner`.
- Do not store the raw lockcode in this manual.

Unlock SOP:

1. Open `https://amazmaxs.cloud/owner-lock`.
2. Enter the owner lockcode.
3. Confirm the app redirects to `/`.
4. Continue to `/admin`, `/dashboard`, or workflow pages.

Recovery SOP if locked out:

1. SSH into the VPS.
2. Open `/opt/namigo/.env.production`.
3. Confirm `NAMIGO_OWNER_LOCKCODE` exists.
4. Confirm `NAMIGO_LICENSE_DOMAIN=amazmaxs.cloud`.
5. Confirm `NAMIGO_LICENSE_SERVER_IP=157.173.121.122`.
6. Confirm `NAMIGO_DEPLOYMENT_IP=157.173.121.122`.
7. Restart the web container with `cd /opt/namigo && docker compose up -d --build namigo-web`.

Emergency disable:

1. SSH into the VPS.
2. Set `NAMIGO_OWNER_PROTECTION=disabled` in `/opt/namigo/.env.production`.
3. Copy the same value to `/opt/namigo/.env`.
4. Restart `namigo-web`.
5. Re-enable after recovery.

Rotation SOP:

1. Generate a new high-entropy owner lockcode.
2. Update `NAMIGO_OWNER_LOCKCODE` in `/opt/namigo/.env.production`.
3. Update the password manager item.
4. Restart `namigo-web`.
5. Open `/owner-lock` in a private browser window and test the new lockcode.

Important limitation:

- This is a technical deterrent and ownership watermark, not a replacement for legal IP protection.
- If a hostile person has full root access and source code, any software lock can eventually be removed.
- Keep VPS, Hostinger, Supabase, n8n, and password manager access restricted.
- Register and document brand/IP ownership separately for legal protection.

## 15. Release Checklist

Before declaring NamiGo X production-ready:

- App build passes.
- Public domain HTTPS passes.
- Register/login passes.
- Admin passcode generation passes.
- Demo kit creation requires passcode.
- Direct API without passcode is rejected.
- Supabase migrations applied.
- Stripe checkout and webhook tested.
- n8n workflows imported and activated.
- AI provider keys verified.
- Jajan Viral customer allocation entered.
- Backup and credential rotation plan completed.
