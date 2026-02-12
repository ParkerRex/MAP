# OpenClaw WS Parity: 8-Agent Execution Plan

## Status
Completed (2026-02-12). MAP Rust gateway now recognizes the full OpenClaw `BASE_METHODS` surface; remaining work (if any) is behavior-level parity, not method-name coverage.

## Goal
Implement full OpenClaw gateway RPC method compatibility in MAP Rust gateway WebSocket (`/v1/ws`) so every OpenClaw method is either:
- implemented with valid response shape, or
- returns a structured explicit error (`unavailable` / `invalid_request`),
- and never returns `method_not_found` for supported OpenClaw method names.

## Initial Gap (Historical)
This was the starting method-name diff when the plan was written; it is now resolved.

- `agent.identity.get`
- `browser.request`
- `cron.status`
- `cron.update`
- `device.pair.approve`
- `device.pair.list`
- `device.pair.reject`
- `device.token.revoke`
- `device.token.rotate`
- `last-heartbeat`
- `node.invoke.result`
- `node.pair.list`
- `node.rename`
- `sessions.compact`
- `sessions.delete`
- `sessions.preview`
- `sessions.usage`
- `sessions.usage.logs`
- `sessions.usage.timeseries`
- `set-heartbeats`
- `skills.bins`
- `skills.install`
- `skills.update`
- `system-event`
- `system-presence`
- `talk.mode`
- `tts.convert`
- `tts.disable`
- `tts.enable`
- `tts.providers`
- `tts.setProvider`
- `tts.status`
- `update.run`
- `usage.cost`
- `usage.status`
- `voicewake.get`
- `voicewake.set`
- `web.login.start`
- `web.login.wait`

## Constraints
- Preserve existing behavior for already-implemented methods.
- Avoid giant single-file conflicts in `backend/apps/gateway/src/routes/ws.rs`.
- Prefer adding `ws_methods/*` modules and thin dispatch wiring in `ws.rs`.
- Keep response envelope format unchanged:
  - success: `{ type: "res", id, ok: true, payload }`
  - failure: `{ type: "res", id, ok: false, error: { code, message } }`

## Recommended File Ownership Layout

Create (or extend) a modular structure:
- `backend/apps/gateway/src/routes/ws_methods/mod.rs`
- `backend/apps/gateway/src/routes/ws_methods/sessions_usage.rs`
- `backend/apps/gateway/src/routes/ws_methods/skills_ext.rs`
- `backend/apps/gateway/src/routes/ws_methods/cron_control.rs`
- `backend/apps/gateway/src/routes/ws_methods/nodes_device.rs`
- `backend/apps/gateway/src/routes/ws_methods/web_login.rs`
- `backend/apps/gateway/src/routes/ws_methods/media_tools.rs`
- `backend/apps/gateway/src/routes/ws_methods/system_runtime.rs`

(If existing structure differs, keep equivalent ownership boundaries.)

## 8-Agent Task Split

### Agent 1 — Dispatch/Registry Owner (must merge first)
**Owns**
- `backend/apps/gateway/src/routes/ws.rs`
- `backend/apps/gateway/src/routes/ws_methods/mod.rs`
- `backend/apps/gateway/src/auth.rs` (if scope map changes needed)

**Tasks**
- Add canonical method mapping for all currently missing method names.
- Wire dispatch to module handlers (no big business logic here).
- Ensure unknown methods remain only truly unknown inputs.
- Add/extend method-matrix tests for canonical mapping.

**Deliverable**
- All missing method names route to some handler path.

---

### Agent 2 — Sessions + Usage
**Owns**
- `backend/apps/gateway/src/routes/ws_methods/sessions_usage.rs`

**Methods**
- `sessions.compact`
- `sessions.delete`
- `sessions.preview`
- `sessions.usage`
- `sessions.usage.logs`
- `sessions.usage.timeseries`
- `usage.cost`
- `usage.status`

**Tasks**
- Implement DB-backed behavior using existing `sessions`, `session_messages`, `chat_runs`.
- For unimplemented analytics depth, return structured `unavailable` with clear message, not `method_not_found`.
- Add tests for response shape and pagination/limits.

---

### Agent 3 — Skills Extended
**Owns**
- `backend/apps/gateway/src/routes/ws_methods/skills_ext.rs`

**Methods**
- `skills.bins`
- `skills.install`
- `skills.update`
- (verify parity semantics for `skills.status` if needed)

**Tasks**
- Reuse `skills_runtime` and existing config persistence patterns.
- Ensure updates are idempotent and validated.
- Add tests for update/install request validation and output shape.

---

### Agent 4 — Cron + Runtime Controls
**Owns**
- `backend/apps/gateway/src/routes/ws_methods/cron_control.rs`

**Methods**
- `cron.status`
- `cron.update`
- `talk.mode`
- `update.run`

**Tasks**
- Extend existing cron behavior for status/update parity.
- Provide predictable runtime-control stubs if full runtime toggles are absent.
- Add tests for update validation and status shape.

---

### Agent 5 — Nodes + Device Pairing Bridge
**Owns**
- `backend/apps/gateway/src/routes/ws_methods/nodes_device.rs`

**Methods**
- `node.invoke.result`
- `node.pair.list`
- `node.rename`
- `device.pair.list`
- `device.pair.approve`
- `device.pair.reject`
- `device.token.rotate`
- `device.token.revoke`

**Tasks**
- Map `device.*` methods onto existing node/pairing storage where possible.
- Implement explicit behavior contracts for result handling.
- Add tests for approve/reject/rotate/revoke lifecycle.

---

### Agent 6 — Web Login
**Owns**
- `backend/apps/gateway/src/routes/ws_methods/web_login.rs`

**Methods**
- `web.login.start`
- `web.login.wait`

**Tasks**
- Implement stateful start/wait flow for web login handshake semantics.
- Ensure timeout behavior and polling semantics are deterministic.
- Add tests for start -> wait success and timeout.

---

### Agent 7 — Browser/TTS/VoiceWake
**Owns**
- `backend/apps/gateway/src/routes/ws_methods/media_tools.rs`

**Methods**
- `browser.request`
- `tts.status`
- `tts.providers`
- `tts.setProvider`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `voicewake.get`
- `voicewake.set`

**Tasks**
- Implement using existing integrations if available.
- Where unavailable, return structured `unavailable` with exact reason and TODO path.
- Add request validation tests and response-shape tests.

---

### Agent 8 — System Runtime + Final Parity Gate (merge last)
**Owns**
- `backend/apps/gateway/src/routes/ws_methods/system_runtime.rs`
- `backend/apps/gateway/src/routes/ws.rs` tests/integration tests
- `docs/migration/chat-control-plane.md` parity appendix

**Methods**
- `agent.identity.get`
- `last-heartbeat`
- `set-heartbeats`
- `system-event`
- `system-presence`

**Tasks**
- Implement system/runtime metadata methods.
- Add final parity suite:
  - every OpenClaw method name recognized by canonical map
  - no recognized method returns `method_not_found`
  - aliases behave as expected
- Update docs with completed matrix and known partials.

## Merge Order
1. Agent 1
2. Agents 2, 3, 4, 5, 6, 7 (parallel, rebasing on Agent 1)
3. Agent 8 (integration + parity gate)

## Definition of Done
- [ ] All methods in "Current Gap" are recognized by canonical mapping.
- [ ] Each method has deterministic behavior with valid envelope.
- [ ] Unsupported internals return explicit `unavailable`/`invalid_request` only.
- [ ] `cargo check -p map-gateway` passes.
- [ ] `cargo test -p map-gateway` passes with parity tests.
- [ ] Docs updated with exact implemented/partial semantics.

## Coordinator Checklist (for whoever integrates)
- [ ] Re-run method diff against OpenClaw handlers.
- [ ] Run ws method-matrix and alias contract tests.
- [ ] Verify scope matrix (`auth::required_ws_scope`) includes newly added methods.
- [ ] Spot-check web and iOS still function for existing chat workflows.
