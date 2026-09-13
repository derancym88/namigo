-- 0002_subscription_feature_flags.sql
-- Subscription state and per-tier feature gating.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tier text not null default 'trial',
  credits_total integer not null default 0,
  credits_used integer not null default 0,
  status text not null default 'inactive',
  activated_at timestamptz,
  -- Credits are valid for 3 months from activation and expire automatically.
  expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_idx on public.subscriptions (user_id);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  min_tier text not null default 'starter',
  description text,
  updated_at timestamptz not null default now()
);

insert into public.feature_flags (key, enabled, min_tier, description) values
  ('stage_video_generation', true,  'professional', 'Cinematic video generation (WF-07)'),
  ('stage_image_generation', true,  'starter',      '4K commercial image generation (WF-06)'),
  ('multi_language_output',  true,  'professional', 'Malay and Chinese output'),
  ('sku_library',            false, 'business',     'Repeat-production SKU library'),
  ('human_qc_pass',          false, 'diamond',      'Human quality-control review')
on conflict (key) do nothing;

alter table public.subscriptions enable row level security;
alter table public.feature_flags enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Feature flags are readable by any signed-in user; writes go through the
-- service role from /admin.
drop policy if exists "feature_flags_read" on public.feature_flags;
create policy "feature_flags_read" on public.feature_flags
  for select using (auth.role() = 'authenticated');
