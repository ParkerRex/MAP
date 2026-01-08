# Convex Migration Plan (Greenfield + Hard Cutover)

> Generated: 2026-01-07
> Status: Implementation Complete — Ready for Launch Execution
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

- Track A: Platform & Data Model — Owner: Backend ✅
- Track B: Auth & Identity — Owner: Backend/Web ✅
- Track C: Web App (TanStack Start) — Owner: Web ✅
- Track D: AI Chat & Agents — Owner: AI/Backend ✅
- Track E: Integrations (Google Calendar, WHOOP) — Owner: Integrations ✅
- Track F: iOS App — Owner: iOS ✅
- Track G: QA/Release/Observability — Owner: QA/DevOps 🔶 (Execution pending)

## Milestones (Parallel Tracks, Shared Gates)

**M0 — Kickoff + Architecture Lock** ✅
- Owners: Tech Lead + Track Owners
- Exit: final scope & constraints approved; track owners assigned; migration schedule agreed.

**M1 — Convex Foundation Ready** ✅
- Owners: Track A + Track B
- Exit: Convex project/environments ready; core schema, indexes, and access patterns defined; Google OAuth working on web.

**M2 — Feature Tracks in Parallel** ✅
- Owners: Tracks C/D/E/F
- Exit: web verticals (tasks/notes/calendar/health/goals) wired to Convex; AI chat streaming + files; integrations run in workflows; iOS reads/writes through Convex SDK.

**M3 — Launch Readiness** 🔶 (In Progress)
- Owners: Track G + All
- Exit: end-to-end tests, perf checks, monitoring/alerts, and launch checklist complete.
- Remaining: G2 (load test with k6), G4 (security review)

**M4 — Hard Cutover + Launch** ⏳ (Pending M3)
- Owners: Tech Lead + All
- Exit: production cutover completed; old services retired; post-launch monitoring stable.

## Backlog (Concrete, Track-Based)

### Track A — Platform & Data Model (Owner: Backend) ✅

- [x] A1: Create Convex project + environments (dev/stage/prod); set up secrets for Google/WHOOP/LLM. → `convex/convex.config.ts`
- [x] A2: Define schema for users, tasks, notes, calendar, health metrics, goals, chat threads/messages, files. → `convex/schema.ts`
- [x] A3: Define access-control patterns (role-based and per-user data scoping). → `convex/lib/auth.ts`, `convex/lib/ownership.ts`
- [x] A4: Design indexes + query patterns for high-volume collections (health metrics, chat messages). → `convex/schema.ts` (extensive indexes)
- [x] A5: Establish data lifecycle rules (retention, soft delete, archival if needed). → `deletedAt` fields + soft delete pattern

### Track B — Auth & Identity (Owner: Backend/Web) ✅

- [x] B1: Configure Better Auth with Google provider. → `convex/auth.ts`, `convex/auth.config.ts`
- [x] B2: Implement web OAuth flow (TanStack Start) and session handling. → `src/lib/auth-client.ts`, `src/routes/settings.tsx`
- [x] B3: Implement iOS web OAuth flow (ASWebAuthenticationSession) + token storage. → `SessionService.swift`, `src/routes/auth/ios.tsx`
- [x] B4: Map Convex identity to app user model and permissions. → `convex/auth.ts` (triggers: onCreate, onUpdate, onDelete)
- [x] B5: Create minimal account settings UI (connect/disconnect Google). → `src/routes/settings.tsx`

### Track C — Web App (TanStack Start) (Owner: Web) ✅

- [x] C1: Bootstrap TanStack Start app with Convex client. → `src/routes/__root.tsx`, `vite.config.ts`
- [x] C2: Implement core layout/routing/navigation for dashboard. → `src/routes/index.tsx`, `src/components/start/app-shell.tsx`
- [x] C3: Tasks module with realtime updates. → `src/routes/tasks.tsx`, `convex/tasks.ts`
- [x] C4: Notes module with search + realtime. → `src/routes/notes.tsx`, `convex/notes.ts` (searchIndex)
- [x] C5: Calendar module with CRUD + sync status. → `src/routes/calendar.tsx`, `convex/calendar.ts`
- [x] C6: Health module UI with summary + trend views. → `src/routes/health.tsx`, `convex/health.ts`
- [x] C7: Goals module with completion tracking. → `src/routes/goals.tsx`, `convex/goals.ts`
- [x] C8: AI chat UI with streaming + attachments. → `src/routes/chat.tsx`, `convex/chat.ts`

### Track D — AI Chat & Agents (Owner: AI/Backend) ✅

- [x] D1: Implement agent thread/message models and server actions. → `convex/chat.ts` (createThread, createRun, listMessages)
- [x] D2: Add streaming responses using persistent text streaming. → `convex/chat.ts` (PersistentTextStreaming, streamChat httpAction)
- [x] D3: Support file attachments (upload → message → async response). → `convex/chat.ts` (uploadFile action, 8MB limit)
- [x] D4: Add retrieval context (hybrid text/vector) for chat history. → `convex/chat.ts` (contextOptions: textSearch + vectorSearch)
- [x] D5: Add safety/limits (rate limits, message size, file constraints). → `convex/chat.ts` (RateLimiter: 30 threads/min, 12 messages/min)

### Track E — Integrations (Owner: Integrations) ✅

- [x] E1: Google Calendar OAuth + token storage. → `convex/integrations.ts`
- [x] E2: Calendar sync workflows (pull events, updates, deletions). → `convex/googleCalendar.ts`
- [x] E3: WHOOP OAuth + token storage. → `convex/integrations.ts`
- [x] E4: WHOOP sync workflows (recovery/sleep/strain/workouts). → `convex/whoop.ts`
- [x] E5: Settings UI + status checks for integrations. → `convex/integrations.ts` (queries)

### Track F — iOS App (Owner: iOS) ✅

- [x] F1: Add Convex Swift SDK and configure environment switching. → `ios/Package.swift`
- [x] F2: Implement Google OAuth (web-based flow) + Keychain storage. → Existing `SessionService.swift`
- [x] F3: Wire core data reads/writes (tasks/notes/calendar/health/goals). → `ios/Sources/MapHealthCore/Services/ConvexClient.swift`
- [x] F4: Implement AI chat streaming + file attachments. → `ios/Sources/MapHealthCore/Services/ConvexChatService.swift`
- [x] F5: HealthKit ingestion → Convex schema mapping + background sync. → `ios/Sources/MapHealthCore/Services/ConvexHealthSync.swift`

### Track G — QA/Release/Observability (Owner: QA/DevOps) 🔶

- [x] G1: End-to-end test plan across web + iOS (core flows + auth). → `docs/test-plan.md`
- [ ] G2: Load/perf verification for high-volume data (health, chat). → (Execute with k6 per `docs/monitoring.md`)
- [x] G3: Monitoring + alerting (Convex logs, error tracking). → `docs/monitoring.md`
- [ ] G4: Security review (auth scopes, data isolation, file access). → (Manual review pending)
- [x] G5: Hard cutover checklist + rollback plan (if needed). → `docs/cutover-checklist.md`

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
