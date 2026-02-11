# Rust/Postgres Cutover Status (2026-02-11)

## Shipped

- Backend gateway is running in Rust with Postgres-backed routes.
- Chat experience is cut over to Rust gateway APIs.
- Core app routes are now API-driven (no Convex client wiring in root router):
  - `/tasks`
  - `/notes`
  - `/goals`
  - `/calendar`
  - `/health`
  - `/settings`
  - `/auth/ios`
- Shared frontend fetch utility added: `src/lib/client-api.ts`.
- iOS session handoff endpoint added: `GET /api/auth/token`.
- Goal category/status validation centralized for API handlers.
- Legacy Convex auth bridge removed:
  - `src/lib/auth-server.ts` deleted
  - `src/routes/api/auth/$.ts` deleted

## Regression Coverage Added

- `src/app/api/goals/validation.test.ts`
  - Ensures only supported goal categories/status values are accepted.
- `src/lib/client-api.test.ts`
  - Ensures `apiRequest` handles:
    - successful JSON responses
    - structured API errors (`message`, `code`, `details`)
    - non-JSON error fallback behavior

Run:

```bash
bun test src/app/api/goals/validation.test.ts src/lib/client-api.test.ts
```

## Remaining Work To Fully Leave Convex

- Remove legacy Convex server modules under `convex/` after parity endpoints are complete and traffic is cut over.
- Remove Convex packages from `package.json` once no imports remain.
- Replace generated route-tree placeholder with generated TanStack route tree in CI/build.
- Resolve typecheck failures still unrelated to this cutover slice:
  - `.next/dev/types/validator.ts` noise
  - lingering Convex-generated type imports
  - existing API typing issues in unrelated routes

## Recommended Next Migration Order

1. Migrate any remaining data writes in `src/components/*` that still rely on old assumptions.
2. Remove dead Convex-only API surface once route consumers are fully switched.
3. Run a full auth/session regression pass (web + iOS handoff).
4. Remove Convex dependencies and delete `convex/` directory in one controlled cleanup PR.
