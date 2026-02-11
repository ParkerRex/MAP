alter table chat_runs
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table cron_jobs
  add column if not exists next_run_at timestamptz,
  add column if not exists last_run_at timestamptz,
  add column if not exists last_error text;

create table if not exists node_pairings (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references nodes(id) on delete cascade,
  token_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(node_id)
);

create index if not exists idx_pairing_requests_provider_status on pairing_requests(provider, status, expires_at);
create index if not exists idx_cron_jobs_next_run on cron_jobs(enabled, next_run_at);
create index if not exists idx_auth_profiles_provider on auth_profiles(provider);
create index if not exists idx_channel_routes_provider_peer on channel_routes(provider, peer_key);
