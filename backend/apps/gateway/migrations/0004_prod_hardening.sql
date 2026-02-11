create table if not exists gateway_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  auth_subject text not null,
  method text not null,
  idempotency_key text not null,
  request_hash text not null,
  status text not null default 'in_progress',
  run_id uuid references chat_runs(id) on delete set null,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  unique(auth_subject, method, idempotency_key)
);

create index if not exists idx_gateway_idempotency_expires
  on gateway_idempotency_keys(expires_at);

create table if not exists gateway_ws_events (
  id bigserial primary key,
  auth_subject text not null,
  event text not null,
  run_id uuid,
  session_id uuid,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gateway_ws_events_subject_cursor
  on gateway_ws_events(auth_subject, id);

create index if not exists idx_gateway_ws_events_subject_run
  on gateway_ws_events(auth_subject, run_id, id);

create index if not exists idx_gateway_ws_events_created_at
  on gateway_ws_events(created_at);
