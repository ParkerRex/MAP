# OpenClaw Baseline (for Rust parity implementation)

- Reference repository: `.ai/refs/openclaw`
- Pinned commit: `8c963dc5a680f74cd7a7143263e9ec7d047404c0`
- Upstream URL: `https://github.com/openclaw/openclaw.git`
- Baseline date: `2026-02-11`

## Purpose

This file freezes the OpenClaw behavior target used by MAP’s Rust rewrite so implementation and verification remain stable during the big-bang cutover.

## Parity Targets

| Capability | OpenClaw reference area | MAP Rust module |
|---|---|---|
| Session model (main/direct/group/thread, dmScope) | `docs/concepts/session.md` | `backend/apps/gateway/src/routes/sessions.rs` + session routing engine (next) |
| Auth profile rotation + model fallback | `docs/concepts/model-failover.md` | `backend/apps/gateway/src/routes/models.rs` + auth/model runtime (next) |
| Pairing/allowlist security model | `docs/gateway/pairing.md`, `docs/gateway/security/index.md` | `pairing_*` tables + security subsystem |
| Multi-channel ecosystem | OpenClaw channels docs + connectors | `channel_accounts`, `channel_routes`, channel workers (next) |
| Skills precedence/gating | `docs/tools/skills.md` | `skills` subsystem + loader (next) |
| Cron wakeups + isolated/main runs | `docs/automation/cron-jobs.md` | `cron_jobs`, `cron_runs`, scheduler (next) |
| Node pairing and invocation | `docs/gateway/pairing.md` | `nodes` subsystem (next) |
| Browser/tool orchestration | `docs/tools/browser.md` | tools runtime (next) |
| Security audit surface | `docs/gateway/security/index.md` | `/v1/security/audit` |
| Web control/chat APIs | gateway docs + web docs | `apps/gateway-rs` HTTP/WS surface |

## Notes

- `packages/clawdbot` in OpenClaw is a compatibility shim; parity is measured against OpenClaw runtime behavior, not package naming.
- This baseline is pinned for v1 parity certification. If upstream changes are adopted, update this file with a new commit pin and explicit delta list.

## Current Implementation Snapshot

- Rust gateway is live for chat, sessions, model failover, skills sync, cron, nodes, security audit, and channel routing APIs.
- Session key mapping now follows OpenClaw-style shapes for `main`, direct DM scopes, group, channel/room, and thread/topic paths.
- Channel DM pairing/allowlist flow is implemented at gateway level via `/v1/channels/inbound` and `/v1/channels/pairing/*`.
- Remaining parity gap is channel connector runtime execution (provider-specific transports and media behavior).
