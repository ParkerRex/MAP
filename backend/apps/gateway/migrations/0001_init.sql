create extension if not exists pgcrypto;

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  prompt text not null,
  status text not null,
  output text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chat_runs_session on chat_runs(session_id, created_at);

create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_session_messages_session on session_messages(session_id, created_at);

create table if not exists channel_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  account_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, account_key)
);

create table if not exists channel_routes (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  account_id uuid references channel_accounts(id) on delete cascade,
  peer_key text not null,
  session_scope text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pairing_requests (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  peer_key text not null,
  code text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pairing_allowlists (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  peer_key text not null,
  approved_at timestamptz not null default now(),
  unique(provider, peer_key)
);

create table if not exists auth_profiles (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  profile_id text not null,
  profile_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, profile_id)
);

create table if not exists auth_usage_stats (
  id uuid primary key default gen_random_uuid(),
  auth_profile_id uuid not null references auth_profiles(id) on delete cascade,
  last_used_at timestamptz,
  cooldown_until timestamptz,
  disabled_until timestamptz,
  disabled_reason text,
  error_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(auth_profile_id)
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null unique,
  source_type text not null,
  source_path text not null,
  metadata jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cron_jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  schedule_kind text not null,
  schedule_expr text not null,
  timezone text,
  payload jsonb not null,
  session_target text not null,
  delivery_mode text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cron_runs (
  id uuid primary key default gen_random_uuid(),
  cron_job_id uuid not null references cron_jobs(id) on delete cascade,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  output jsonb not null default '{}'::jsonb
);

create table if not exists nodes (
  id uuid primary key default gen_random_uuid(),
  node_key text not null unique,
  display_name text,
  pairing_status text not null default 'pending',
  capabilities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  action text not null,
  actor text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
