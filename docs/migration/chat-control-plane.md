# Chat Control Plane (Rust Gateway)

`/chat` now acts as a lightweight control plane for the Rust gateway chat runtime.

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
  - create jobs via `POST /v1/cron/jobs`
  - run now via `POST /v1/cron/jobs/:id/run`
  - delete via `DELETE /v1/cron/jobs/:id`
- Channels + pairing panel:
  - connector/account/route summary from `GET /v1/channels`
  - pending pairing queue from `GET /v1/channels/pairing`
  - approve/reject actions

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
- `POST /v1/cron/jobs`
- `POST /v1/cron/jobs/:id/run`
- `DELETE /v1/cron/jobs/:id`
- `GET /v1/channels`
- `GET /v1/channels/pairing`
- `POST /v1/channels/pairing/:id/approve`
- `POST /v1/channels/pairing/:id/reject`
