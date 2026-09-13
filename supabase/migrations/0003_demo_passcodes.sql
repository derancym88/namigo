-- 0003_demo_passcodes.sql
-- Demo-kit passcodes. Only SHA-256 hashes are stored; plaintext codes are
-- shown to the operator once at generation time and never persisted.

create table if not exists public.demo_passcodes (
  id text primary key,
  label text not null,
  code_hash text not null unique,
  max_uses integer not null default 1,
  uses_count integer not null default 0,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists demo_passcodes_hash_idx on public.demo_passcodes (code_hash);

alter table public.demo_passcodes enable row level security;

-- No policy grants public access on purpose: passcode reads and the
-- redemption update run through the service role only.
drop policy if exists "demo_passcodes_admin_read" on public.demo_passcodes;
create policy "demo_passcodes_admin_read" on public.demo_passcodes
  for select using (exists (
    select 1 from public.admin_settings a where a.user_id = auth.uid()
  ));
