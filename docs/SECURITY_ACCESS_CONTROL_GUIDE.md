# NamiGo X Security and Access Control Guide

Version: 2026-05-06

## Security Paths

Public web app:

- https://amazmaxs.cloud

Admin/operator path:

- https://amazmaxs.cloud/admin

Customer demo-kit path:

- https://amazmaxs.cloud/jobs/new

Owner unlock path:

- https://amazmaxs.cloud/owner-lock

n8n operator path:

- https://n8n.amazmaxs.cloud

Production API paths:

- `POST /api/admin/demo-passcodes`: generate/list passcodes
- `POST /api/jobs`: create job, requires passcode in demo mode
- `POST /api/jobs/[id]/trigger`: trigger workflow step
- `POST /api/n8n/webhook`: receive n8n webhook
- `POST /api/webhooks/stripe`: receive Stripe payment event

## Demo-Kit Passcode SOP

1. Go to `/admin`.
2. Find `Demo-kit passcode control`.
3. Enter the owner PIN.
4. Set a clear label, for example `Jajan Viral demo batch`.
5. Set max uses.
6. Set expiry days.
7. Click `Generate`.
8. Copy the generated passcode immediately.
9. Send only the passcode to the tester/customer.
10. Customer enters passcode at `/jobs/new`.

## Passcode Rules

- Use one passcode per customer, batch, or testing session.
- Use low max-use values for customer demos.
- Use short expiry for tests, such as 1 to 7 days.
- Do not reuse customer passcodes.
- Disable/rotate owner PIN if a staff member leaves.

## Production Admin Model

When Supabase is connected, admin access should be controlled by `public.admin_settings`.

Steps:

1. Owner/admin registers normally.
2. Developer finds the Supabase auth user ID.
3. Developer inserts the user ID into `public.admin_settings`.
4. Admin logs in.
5. `/admin` actions use Supabase session token.

Current owner/admin:

- Email: `quest988@gmail.com`
- Supabase user ID: `83941736-0886-44de-995b-f1311333b380`
- Role: `owner`
- Password location: password manager item `NamiGo X / Supabase / Owner login`
- Required post-handover action: rotate owner login password.

Current internal smoke-test passcode:

- Code: `[REDACTED - see password manager]`
- Purpose: internal live Supabase-mode testing
- Max uses: `25`
- Expiry: `30 days from 2026-05-06`

## Owner Protection System

NamiGo X is protected by an owner lock layer.

Live protection values:

- Owner company: `AMAZ MAXS ENTERPRISE`
- Product: `NamiGo X`
- License ID: `NGX-AMZMAXS-2026-PROD`
- Licensed domain: `amazmaxs.cloud`
- Licensed VPS IP: `157.173.121.122`
- Build fingerprint: `NGX-12DFA8CAA3CCEFCB`
- Supabase table: `public.ownership_control`

Owner lockcode:

- Env variable: `NAMIGO_OWNER_LOCKCODE`
- Location: `/opt/namigo/.env.production`
- Password manager item: `NamiGo X / NamiGo App Owner`
- First deployment used the existing owner PIN as the first lockcode.
- Rotated to a separate unique value on `2026-05-06`.
- Do not store the raw lockcode in docs.

Locked mode behavior:

- If no valid owner unlock cookie exists, protected app pages redirect to `/owner-lock`.
- If the app is copied to a different domain, it remains locked.
- If the configured deployment IP does not match the licensed server IP, it remains locked.
- Stripe and n8n webhook endpoints stay callable because they have their own signature/secret checks.

Owner unlock SOP:

1. Open `https://amazmaxs.cloud/owner-lock`.
2. Enter the owner lockcode.
3. Confirm the app opens.
4. Continue to `/admin` after login.

Emergency unlock/disable SOP:

1. SSH into VPS.
2. Open `/opt/namigo/.env.production`.
3. Confirm or update `NAMIGO_OWNER_LOCKCODE`.
4. If urgent, temporarily set `NAMIGO_OWNER_PROTECTION=disabled`.
5. Restart web app with `cd /opt/namigo && docker compose up -d --build namigo-web`.
6. Re-enable owner protection after access is restored.

## Emergency Lockdown

To stop demo-kit creation immediately:

1. Remove or rotate `NAMIGO_OWNER_PIN`.
2. Restart the web container.
3. Expire or revoke active passcodes.
4. If needed, block `/jobs/new` in nginx temporarily.

To stop all public traffic:

1. SSH to VPS.
2. Stop nginx container.
3. Investigate logs.
4. Restart only after issue is fixed.

## Credential Rotation

Rotate these after handover or whenever exposed:

- VPS root password
- Hostinger password
- n8n login
- Supabase service role key
- Stripe secret key
- n8n encryption key
- `NAMIGO_OWNER_PIN`
- AI provider keys

Keep the final credential list in a password manager, not in the repo.

## Production Secrets Register

Use this register to know where each secret lives. Do not paste the actual secret value into this file.

Password manager folder/item:

- Folder: `NamiGo X`
- Main item: `NamiGo X / Production Secrets`
- Supabase item: `NamiGo X / Supabase`
- VPS item: `NamiGo X / VPS`
- Hostinger item: `NamiGo X / Hostinger DNS`
- n8n item: `NamiGo X / n8n`
- Stripe item: `NamiGo X / Stripe`
- AI provider item: `NamiGo X / AI Provider Keys`

Supabase project record:

- Organization: `quest988-Samm's Org`
- Project name: `Namigo X`
- Project ID: `fxiaicfznwmgugypxjlh`
- Project URL: `https://fxiaicfznwmgugypxjlh.supabase.co`
- Region: `Asia-Pacific`
- Created: `2026-05-06`
- Database password location: password manager item `NamiGo X / Supabase`
- Database password hint: [REDACTED - see password manager]
- API keys location: Supabase Dashboard -> Project Settings -> API
- Database connection string location: Supabase Dashboard -> Project Settings -> Database
- Publishable/anon key status: received on `2026-05-06`; stored in VPS env only.
- Secret/service-role key status: received on `2026-05-06`; stored in VPS env only.
- Database migration status: applied through `0003_demo_passcodes`.
- n8n database status: connected through Supabase pooler credential `NamiGo Supabase Postgres`.

Production server env destination:

- VPS path: `/opt/namigo/.env.production`
- Local template: `.env.production.example`
- Required Supabase env:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Required n8n/database access:
  - n8n Postgres credential connected to Supabase database
  - or server-side Postgres connection fields if the workflow is refactored to use env-based database access

After adding or rotating secrets:

1. Update `/opt/namigo/.env.production`.
2. Restart services with `cd /opt/namigo && docker compose up -d`.
3. Confirm the web app loads.
4. Confirm n8n loads.
5. Run a test registration/login.
6. Run one full test kit before accepting customer work.
