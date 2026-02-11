# OpenClaw -> MAP Rust Parity Roadmap

This is the concrete feature porting sequence to match OpenClaw behavior while keeping MAP on a Rust backend + TypeScript frontend.

## Parity Feature Set (Top 10)

1. Multi-provider model routing (Kimi + Claude + OpenAI) with ordered fallback.
2. Persistent sessions/runs/messages with resumable streaming.
3. Tool/skill execution with allow-listing and per-user policy.
4. Confirm-before-write workflow for destructive actions.
5. Cron/task automation runtime with persisted schedules.
6. Node/workflow graph execution with channel routing.
7. Security rule evaluation with audit logging.
8. Channel inbox model (notifications + processing status).
9. Model/provider key management per user with encryption at rest.
10. Health + diagnostics endpoints for route/service readiness.

## Rust Backend Track

- Keep all parity endpoints under `backend/apps/gateway/src/routes`.
- Treat Postgres schema + migrations as source of truth.
- Implement missing parity capabilities as isolated route modules with:
  - request schema validation
  - service-layer handlers
  - integration tests where feasible

## Frontend Track

- Keep frontend as API consumer only (`/api/*`).
- Continue replacing any legacy client/state assumptions with:
  - `apiRequest`
  - TanStack Query cache invalidation
  - explicit optimistic updates only where safe

## Definition of Done

- No runtime traffic requires Convex.
- `src/` contains no Convex imports.
- Convex dependencies removed from `package.json`.
- `convex/` directory deleted.
- End-to-end chat flow works with Kimi as selectable primary model and fallback models configured.
