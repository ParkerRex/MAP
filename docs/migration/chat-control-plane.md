# Chat Control Plane (Rust Gateway)

`/chat` now acts as a lightweight control plane for the Rust gateway chat runtime.

## UI Architecture

The route shell (`src/routes/chat.tsx`) now composes focused panels under
`src/components/chat/*`:

- `sessions-panel` (session list + model auth profile CRUD)
- `active-session-panel` (messages, live stream, send form, run diagnostics)
- `security-panel`
- `skills-panel`
- `models-panel` (model preview)
- `cron-panel`
- `channels-panel` (summary, pairing queue, account/route CRUD)
- `inbound-simulator-panel`
- `nodes-panel` (node pairing + token verification)

All panel mutations expose explicit loading/error/success feedback in the UI.

## Available Controls

- Session list and active session selection.
- Model selection from gateway-configured primary + fallback models.
- Auth profile management:
  - list profiles via `models.profiles.list`
  - add/update API key profiles via `models.profiles.upsert`
  - delete profiles via `models.profiles.delete`
- Confirmation gate toggle for destructive/high-impact prompts.
- Latest run diagnostics:
  - status
  - model used
  - per-attempt failover trail (provider/model/profile/result)
- Security panel:
  - gateway audit status
  - individual security/runtime checks
- Skills panel:
  - list discovered skills and precedence order
  - trigger rescan via `skills.rescan`
- Cron automation panel:
  - list jobs via `cron.jobs.list` (alias `cron.list`)
  - list recent runs via `cron.runs.list` (alias `cron.runs`)
  - create jobs via `cron.jobs.create` (alias `cron.add`)
  - run now via `cron.jobs.run` (alias `cron.run`)
  - delete via `cron.jobs.delete` (alias `cron.remove`)
- Channels + pairing panel:
  - connector/account/route summary via `channels.summary` / `channels.status`
  - account list/upsert/delete:
    - `channels.accounts.list`
    - `channels.accounts.upsert`
    - `channels.accounts.delete`
  - route list/upsert/delete:
    - `channels.routes.list`
    - `channels.routes.upsert`
    - `channels.routes.delete`
  - pending pairing queue via `channels.pairing.list`
  - approve/reject via `channels.pairing.approve` / `channels.pairing.reject`
- Node pairing panel:
  - request pair codes
  - approve/reject pending node pair requests
  - pairing decisions now return consistent payloads (`status`, `approved`, `rejected`, `token`, `node_key`, `peer_key`)
  - verify issued node token via `nodes.verify` (alias `node.pair.verify`)
  - view paired node status and one-time issued token
- Inbound simulator panel:
  - simulate inbound connector events with provider/peer kind/policy
  - validate pairing and destructive-confirmation outcomes (`accepted`, `requires_pairing`, `requires_confirmation`, pairing code)
  - inspect routed session/run/model output metadata
- Model preview panel:
  - invoke `models.generate` directly
  - verify selected model/fallback and attempt chain without creating chat session state

## Confirmation Gate Behavior

Rust gateway now marks certain prompts as high impact if they contain destructive markers (for example `drop table`, `rm -rf`, `delete production`).

- If the prompt is high impact and not confirmed:
  - run status becomes `needs_confirmation`
  - assistant output explains that confirmation is required
- To proceed:
  - enable the UI checkbox `Confirm high-impact actions for this message`
  - resend the prompt

This behavior now applies to both:
- `POST /v1/chat/runs`
- `POST /v1/channels/inbound` (set `confirmed: true` to proceed)
- `chat.send` (set `confirmed: true`)
- `channels.inbound` (set `confirmed: true`)

## API Endpoints Used By `/chat`

- `GET /v1/ws` (single control-plane transport for chat + panels)
- `GET /v1/health` (environment health probe)

## WebSocket Control Plane

`/chat` now uses the Rust gateway WebSocket endpoint at `GET /v1/ws` for chat and control-plane parity:

- `connect`
- `sessions.list`
- `sessions.create`
- `sessions.patch`
- `sessions.reset`
- `sessions.resolve`
- `chat.history`
- `chat.send`
- `chat.inject`
- `chat.abort`
- `models.list`
- `models.profiles.list`
- `models.profiles.upsert`
- `models.profiles.delete`
- `models.generate`
- `skills.list` / `skills.status`
- `skills.rescan`
- `security.audit`
- `cron.jobs.list` / `cron.list`
- `cron.runs.list` / `cron.runs`
- `cron.jobs.create` / `cron.add`
- `cron.jobs.run` / `cron.run`
- `cron.jobs.delete` / `cron.remove`
- `channels.summary` / `channels.status`
- `channels.accounts.list` / `channels.accounts.upsert` / `channels.accounts.delete`
- `channels.routes.list` / `channels.routes.upsert` / `channels.routes.delete`
- `channels.resolveSession`
- `channels.inbound`
- `channels.pairing.list` / `channels.pairing.approve` / `channels.pairing.reject`
- `nodes.list` / `node.list`
- `nodes.pair.request` / `node.pair.request`
- `nodes.pair.approve` / `node.pair.approve`
- `nodes.pair.reject` / `node.pair.reject`
- `nodes.verify` / `node.pair.verify`

The gateway emits `chat` events for live run updates:

- `run.started`
- `delta`
- `run.finished`
- `injected`

## Smoke Verification

Run a quick control-plane endpoint check:

```bash
RUST_GATEWAY_URL=http://localhost:18789 \
RUST_GATEWAY_TOKEN=... \
./scripts/smoke-gateway-control-plane.sh
```
