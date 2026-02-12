# WS Stream 4: Cron + Runtime Controls

This document captures the MAP Rust gateway behavior for Stream 4 OpenClaw parity methods.

## Methods

Implemented in `backend/apps/gateway/src/routes/ws_methods/cron_control.rs` and dispatched from WS canonical methods:

- `cron.status`
- `cron.update`
- `talk.mode`
- `update.run`

## Behavior Summary

- `cron.status`: Returns gateway cron runtime status shape with enabled flag, backend store path, job count, next wake timestamp, and poll interval.
- `cron.update`: Updates an existing cron job by `id`/`job_id` (UUID), validates patch payloads, and returns the updated DB row.
- `talk.mode`: Stores deterministic in-memory talk-mode state and returns `{ enabled, phase, ts }`.
- `update.run`: Validates request fields and returns structured `unavailable` while runtime update/restart automation is not implemented.

## Request Compatibility

Stream 4 handlers accept MAP camelCase and OpenClaw snake_case aliases for key params:

- `id` / `job_id`
- `sessionKey` / `session_key`
- `restartDelayMs` / `restart_delay_ms`
- `timeoutMs` / `timeout_ms`
- `sessionTarget` / `session_target`
- `deliveryMode` / `delivery_mode`

## Error Contract

Validation and operational failures return WS structured errors via `WsMethodError` mapped to:

- `invalid_request` for malformed params and invalid patch fields.
- `not_found` for unknown cron job IDs in `cron.update`.
- `unavailable` for known-but-unimplemented runtime functionality (`update.run`) and unsupported OpenClaw patch fields (for example `deleteAfterRun`).

No Stream 4 method should surface `method_not_found` when canonical mapping recognizes it.

## Regression Coverage

Current coverage includes:

- method matrix alias checks in `routes::ws::tests::ws_method_matrix_supports_map_and_openclaw_aliases`.
- `update.run` unavailable regression test in `routes::ws_methods::cron_control::tests::update_run_returns_unavailable_for_valid_request`.
