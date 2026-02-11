alter table sessions
  add column if not exists session_key text;

create unique index if not exists idx_sessions_session_key_unique
  on sessions(session_key)
  where session_key is not null;

create unique index if not exists idx_channel_routes_unique_with_account
  on channel_routes(provider, account_id, peer_key, session_scope)
  where account_id is not null;

create unique index if not exists idx_channel_routes_unique_without_account
  on channel_routes(provider, peer_key, session_scope)
  where account_id is null;
