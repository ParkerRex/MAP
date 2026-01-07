# Convex Migration Plan (Greenfield + Hard Cutover)

> Generated: 2026-01-07
> Status: Draft
> Scope: Replace backend/services with Convex, move web to TanStack Start, iOS to Convex Swift SDK, ship Google OAuth at launch.

## Decisions & Constraints

- Greenfield rebuild; migrate all product areas at once (no incremental service-by-service cutover).
- Hard cutover at launch; no dual-write or phased user migration.
- Auth: Google-only at launch.
- iOS auth flow: web OAuth is acceptable (opt for simplest web-based flow).
- AI chat includes file attachments in v1.
- Web is client-first; SSR deferred to later (e.g., blog).

## Success Criteria

- Single Convex project powers web + iOS with realtime subscriptions and server actions.
- Feature parity: calendar, tasks, notes, health, goals, AI chat.
- Google OAuth works end-to-end on web + iOS.
- AI chat supports streaming responses and file attachments.
- Hard cutover with stable launch (no regressions vs current behavior).

## Tracks & Owners (Parallel Execution)

- Track A: Platform & Data Model — Owner: Backend
- Track B: Auth & Identity — Owner: Backend/Web
- Track C: Web App (TanStack Start) — Owner: Web
- Track D: AI Chat & Agents — Owner: AI/Backend
- Track E: Integrations (Google Calendar, WHOOP) — Owner: Integrations
- Track F: iOS App — Owner: iOS
- Track G: QA/Release/Observability — Owner: QA/DevOps

## Milestones (Parallel Tracks, Shared Gates)

**M0 — Kickoff + Architecture Lock**
- Owners: Tech Lead + Track Owners
- Exit: final scope & constraints approved; track owners assigned; migration schedule agreed.

**M1 — Convex Foundation Ready**
- Owners: Track A + Track B
- Exit: Convex project/environments ready; core schema, indexes, and access patterns defined; Google OAuth working on web.

**M2 — Feature Tracks in Parallel**
- Owners: Tracks C/D/E/F
- Exit: web verticals (tasks/notes/calendar/health/goals) wired to Convex; AI chat streaming + files; integrations run in workflows; iOS reads/writes through Convex SDK.

**M3 — Launch Readiness**
- Owners: Track G + All
- Exit: end-to-end tests, perf checks, monitoring/alerts, and launch checklist complete.

**M4 — Hard Cutover + Launch**
- Owners: Tech Lead + All
- Exit: production cutover completed; old services retired; post-launch monitoring stable.

## Backlog (Concrete, Track-Based)

### Track A — Platform & Data Model (Owner: Backend)

- [ ] A1: Create Convex project + environments (dev/stage/prod); set up secrets for Google/WHOOP/LLM.
- [ ] A2: Define schema for users, tasks, notes, calendar, health metrics, goals, chat threads/messages, files.
- [ ] A3: Define access-control patterns (role-based and per-user data scoping).
- [ ] A4: Design indexes + query patterns for high-volume collections (health metrics, chat messages).
- [ ] A5: Establish data lifecycle rules (retention, soft delete, archival if needed).

### Track B — Auth & Identity (Owner: Backend/Web)

- [ ] B1: Configure Better Auth with Google provider.
- [ ] B2: Implement web OAuth flow (TanStack Start) and session handling.
- [ ] B3: Implement iOS web OAuth flow (ASWebAuthenticationSession) + token storage.
- [ ] B4: Map Convex identity to app user model and permissions.
- [ ] B5: Create minimal account settings UI (connect/disconnect Google).

### Track C — Web App (TanStack Start) (Owner: Web)

- [ ] C1: Bootstrap TanStack Start app with Convex client.
- [ ] C2: Implement core layout/routing/navigation for dashboard.
- [ ] C3: Tasks module with realtime updates.
- [ ] C4: Notes module with search + realtime.
- [ ] C5: Calendar module with CRUD + sync status.
- [ ] C6: Health module UI with summary + trend views.
- [ ] C7: Goals module with completion tracking.
- [ ] C8: AI chat UI with streaming + attachments.

### Track D — AI Chat & Agents (Owner: AI/Backend)

- [ ] D1: Implement agent thread/message models and server actions.
- [ ] D2: Add streaming responses using persistent text streaming.
- [ ] D3: Support file attachments (upload → message → async response).
- [ ] D4: Add retrieval context (hybrid text/vector) for chat history.
- [ ] D5: Add safety/limits (rate limits, message size, file constraints).

### Track E — Integrations (Owner: Integrations)

- [ ] E1: Google Calendar OAuth + token storage.
- [ ] E2: Calendar sync workflows (pull events, updates, deletions).
- [ ] E3: WHOOP OAuth + token storage.
- [ ] E4: WHOOP sync workflows (recovery/sleep/strain/workouts).
- [ ] E5: Settings UI + status checks for integrations.

### Track F — iOS App (Owner: iOS)

- [ ] F1: Add Convex Swift SDK and configure environment switching.
- [ ] F2: Implement Google OAuth (web-based flow) + Keychain storage.
- [ ] F3: Wire core data reads/writes (tasks/notes/calendar/health/goals).
- [ ] F4: Implement AI chat streaming + file attachments.
- [ ] F5: HealthKit ingestion → Convex schema mapping + background sync.

### Track G — QA/Release/Observability (Owner: QA/DevOps)

- [ ] G1: End-to-end test plan across web + iOS (core flows + auth).
- [ ] G2: Load/perf verification for high-volume data (health, chat).
- [ ] G3: Monitoring + alerting (Convex logs, error tracking).
- [ ] G4: Security review (auth scopes, data isolation, file access).
- [ ] G5: Hard cutover checklist + rollback plan (if needed).

## Parallelization Plan

- Start Tracks A/B immediately; they unblock all client work.
- Track C can start after A2 (schema) + B2 (web auth).
- Track F can start after A2 (schema) + B3 (iOS auth).
- Track D can start after A2 (chat schema) + A4 (indexes).
- Track E can start after A1 (secrets) + B1 (auth baseline).
- Track G runs in parallel from M1 onward.

## Out of Scope (for Now)

- SSR for public blog (defer until after launch).
- Dual-run or data backfill for legacy systems (hard cutover only).
