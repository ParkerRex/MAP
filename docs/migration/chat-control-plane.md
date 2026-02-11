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
  - list profiles from `GET /v1/models/profiles`
  - add API key profile via `POST /v1/models/profiles`
  - delete profile via `DELETE /v1/models/profiles/:id`
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
  - trigger rescan via `POST /v1/skills`
- Cron automation panel:
  - list jobs from `GET /v1/cron/jobs`
  - list recent runs from `GET /v1/cron/runs`
  - create jobs via `POST /v1/cron/jobs`
  - run now via `POST /v1/cron/jobs/:id/run`
  - delete via `DELETE /v1/cron/jobs/:id`
- Channels + pairing panel:
  - connector/account/route summary from `GET /v1/channels`
  - account list/upsert/delete:
    - `GET /v1/channels/accounts`
    - `POST /v1/channels/accounts`
    - `DELETE /v1/channels/accounts/:id`
  - route list/upsert/delete:
    - `GET /v1/channels/routes`
    - `POST /v1/channels/routes`
    - `DELETE /v1/channels/routes/:id`
  - pending pairing queue from `GET /v1/channels/pairing`
  - approve/reject actions
- Node pairing panel:
  - request pair codes
  - approve/reject pending node pair requests
  - verify issued node token via `POST /v1/nodes/verify`
  - view paired node status and one-time issued token
- Inbound simulator panel:
  - simulate inbound connector events with provider/peer kind/policy
  - validate pairing policy outcomes (`accepted`, `requires_pairing`, pairing code)
  - inspect routed session/run/model output metadata
- Model preview panel:
  - invoke `POST /v1/models/generate` directly
  - verify selected model/fallback and attempt chain without creating chat session state

## Confirmation Gate Behavior

Rust gateway now marks certain prompts as high impact if they contain destructive markers (for example `drop table`, `rm -rf`, `delete production`).

- If the prompt is high impact and not confirmed:
  - run status becomes `needs_confirmation`
  - assistant output explains that confirmation is required
- To proceed:
  - enable the UI checkbox `Confirm high-impact actions for this message`
  - resend the prompt

## API Endpoints Used By `/chat`

- `GET /v1/sessions`
- `POST /v1/sessions`
- `GET /v1/sessions/:id/messages`
- `GET /v1/sessions/:id/runs`
- `POST /v1/chat/runs`
- `GET /v1/chat/runs/:id/stream`
- `GET /v1/models`
- `GET /v1/models/profiles`
- `POST /v1/models/profiles`
- `DELETE /v1/models/profiles/:id`
- `GET /v1/security/audit`
- `GET /v1/skills`
- `POST /v1/skills`
- `GET /v1/cron/jobs`
- `GET /v1/cron/runs`
- `POST /v1/cron/jobs`
- `POST /v1/cron/jobs/:id/run`
- `DELETE /v1/cron/jobs/:id`
- `GET /v1/channels`
- `GET /v1/channels/accounts`
- `POST /v1/channels/accounts`
- `DELETE /v1/channels/accounts/:id`
- `GET /v1/channels/routes`
- `POST /v1/channels/routes`
- `DELETE /v1/channels/routes/:id`
- `GET /v1/channels/pairing`
- `POST /v1/channels/pairing/:id/approve`
- `POST /v1/channels/pairing/:id/reject`
- `GET /v1/nodes`
- `POST /v1/nodes/pair/request`
- `POST /v1/nodes/pair/approve/:id`
- `POST /v1/nodes/pair/reject/:id`
- `POST /v1/nodes/verify`
- `POST /v1/channels/inbound`
- `POST /v1/models/generate`

## Smoke Verification

Run a quick control-plane endpoint check:

```bash
RUST_GATEWAY_URL=http://localhost:18789 \
RUST_GATEWAY_TOKEN=... \
./scripts/smoke-gateway-control-plane.sh
```
