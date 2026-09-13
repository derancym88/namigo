-- 0001_namigo_core.sql
-- Core tables for the NamiGo X production engine.

create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  passcode_id text,
  status text not null default 'uploaded',
  tier text not null default 'business',
  credit_budget integer not null default 11,
  credits_used integer not null default 0,
  product_image_url text not null,
  intake_brief jsonb not null default '{}'::jsonb,
  product_analysis jsonb,
  market_research jsonb,
  copy_data jsonb,
  image_urls jsonb,
  video_url text,
  launch_kit jsonb,
  export_manifest jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_idx on public.jobs (user_id);
create index if not exists jobs_created_at_idx on public.jobs (created_at desc);

-- Admin allow-list. A user id present here may use /admin in Supabase mode.
create table if not exists public.admin_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- Ownership record kept for audit and proof of control.
create table if not exists public.ownership_control (
  id text primary key,
  owner_company text not null,
  product_name text not null,
  license_id text not null,
  license_domain text not null,
  license_server_ip text not null,
  build_fingerprint text,
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;
alter table public.admin_settings enable row level security;
alter table public.ownership_control enable row level security;

-- Customers see only their own jobs; the service role bypasses RLS entirely.
drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own" on public.jobs
  for select using (auth.uid() = user_id);

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own" on public.jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own" on public.jobs
  for update using (auth.uid() = user_id);

drop policy if exists "admin_settings_self_read" on public.admin_settings;
create policy "admin_settings_self_read" on public.admin_settings
  for select using (auth.uid() = user_id);

drop policy if exists "ownership_admin_read" on public.ownership_control;
create policy "ownership_admin_read" on public.ownership_control
  for select using (exists (
    select 1 from public.admin_settings a where a.user_id = auth.uid()
  ));
