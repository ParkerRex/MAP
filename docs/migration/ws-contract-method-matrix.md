# WS Contract Method Matrix

This document captures websocket control-plane compatibility guarantees across
Map-style naming and OpenClaw-style aliases.

## Method Name Compatibility

Canonical methods may be called by any listed alias:

- `models.list`: `models.list`, `models.get`, `models`
- `skills.list`: `skills.list`, `skills.status`
- `cron.jobs.list`: `cron.jobs.list`, `cron.list`
- `cron.runs.list`: `cron.runs.list`, `cron.runs`
- `cron.jobs.create`: `cron.jobs.create`, `cron.add`
- `cron.jobs.run`: `cron.jobs.run`, `cron.run`
- `cron.jobs.delete`: `cron.jobs.delete`, `cron.remove`
- `cron.status`: `cron.status`, `cron/status`
- `cron.update`: `cron.update`, `cron/update`
- `talk.mode`: `talk.mode`, `talk/mode`
- `update.run`: `update.run`, `update/run`
- `channels.resolveSession`: `channels.resolveSession`, `channels.resolve-session`, `channels.resolve_session`
- `nodes.list`: `nodes.list`, `node.list`
- `nodes.pair.request`: `nodes.pair.request`, `node.pair.request`
- `nodes.pair.approve`: `nodes.pair.approve`, `node.pair.approve`
- `nodes.pair.reject`: `nodes.pair.reject`, `node.pair.reject`
- `nodes.verify`: `nodes.verify`, `node.pair.verify`

## Parameter Alias Compatibility

WS request params accept both:

- Map-style camelCase (for example `sessionId`, `fallbackModels`, `scheduleKind`)
- OpenClaw-style snake_case aliases (for example `session_id`, `fallback_models`, `schedule_kind`)

Notable alias groups include:

- Session and chat fields: `session_id`, `session_key`, `message_limit`, `run_limit`, `run_id`, `idempotency_key`
- Cron fields: `job_id`, `schedule_kind`, `schedule_expr`, `session_target`, `delivery_mode`
- Runtime control fields: `restart_delay_ms`, `timeout_ms`
- Channel routing fields: `peer_kind`, `peer_id`, `account_key`, `thread_id`, `dm_scope`, `dm_policy`, `identity_key`, `agent_id`, `main_key`
- Node fields: `node_id`, `node_key`, `display_name`, `request_id`

## Regression Coverage

Contract checks are enforced by:

- `src/ws-contract-method-matrix.test.ts`

Run:

```bash
bun test src/ws-contract-method-matrix.test.ts
```
