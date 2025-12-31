# Refactoring Opportunities

## Completed

### 1. ✅ Extract Auth Middleware Wrapper
**Status:** Complete

Created `src/lib/api/with-auth.ts` that wraps authenticated API routes:
```typescript
export function withAuth<T>(
  handler: (user: User, request: NextRequest, context: RouteContext) => Promise<T>
) { ... }
```

Refactored 20+ API routes to use this pattern, eliminating ~100 lines of repetitive auth checks.

---

### 2. ✅ Use Existing Zod Schemas
**Status:** Complete

Leveraged existing validation schemas where available. Routes now use consistent validation patterns.

---

### 3. ✅ Centralize Magic Numbers
**Status:** Complete

Created `src/lib/constants.ts`:
```typescript
export const DEFAULT_GOAL_DUE_DAYS = 30;
export const MAX_CALENDAR_RESULTS = 2500;
export const CALENDAR_LIST_MAX_RESULTS = 250;
export const CALENDAR_SYNC_MONTHS_BACK = 6;
export const CALENDAR_SYNC_MONTHS_FORWARD = 6;
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY_MS = 1000;
export const SESSION_COOKIE_NAME = "session";
export const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
```

---

### 4. ✅ Consolidate Hook Patterns
**Status:** Complete

Standardized all hooks to use the centralized API client (`src/lib/api/client.ts`):
- `use-tasks.ts` - already using API client
- `use-notes.ts` - refactored to use API client
- `use-calendar.ts` - refactored to use API client
- `use-whoop.ts` - already using API client

Added Google status endpoint to API client.

---

### 5. ✅ Extract Mutation Boilerplate
**Status:** Complete

Created `src/lib/api/mutation-factory.ts` with:
- `useSimpleMutation` - for basic mutations with query invalidation
- `useOptimisticMutation` - for mutations with optimistic updates

Refactored hooks to use these factories, reducing boilerplate by 25-50%.

---

## Medium Priority - Code Quality (Pending)

### 6. DRY Up Database Task Mapping
`src/db/tasks.ts` has duplicate 30-field SELECT clauses (lines 35-60 and 121-147).

**Fix:** Extract to a constant `taskSelectFields`.

---

### 7. Move Stats Calculation to SQL
`src/db/goals.ts:50-59` fetches all goals then filters in JS.

**Fix:** Use SQL aggregation instead.

---

### 8. Remove Redundant Ownership Checks
`src/db/tasks.ts:207` and `src/db/notes.ts:107` query for ownership before deleting, but the DELETE already has a WHERE clause checking userId.

---

## Lower Priority - Cleanup (Pending)

### 9. Type Definition Consolidation
Types are scattered across `src/db/schema.ts`, `src/lib/api/client.ts`, and `src/types/*.ts`.

**Fix:** Establish clear hierarchy with single source of truth.

---

### 10. Remove Unused Props
`src/components/notes/note-display.tsx:10-16` has unused props.

---

### 11. Extract Retry Logic
`src/app/api/calendar/sync/route.ts:58-81` has custom retry logic.

**Fix:** Extract to `src/lib/api/retry.ts` for reuse.

---

### 12. Standardize Error Detail Formatting
Different approaches: `parsed.error.flatten()` vs `parsed.error.flatten().fieldErrors`.

---

## Summary

| Refactor | Status | Effort | Impact |
|----------|--------|--------|--------|
| Auth wrapper | ✅ Done | Low | High |
| Use Zod schemas | ✅ Done | Low | Medium |
| Constants file | ✅ Done | Very Low | Low |
| Standardize hooks | ✅ Done | Medium | Medium |
| Mutation factory | ✅ Done | High | High |
| DRY DB mapping | Pending | Low | Low |
| SQL aggregation | Pending | Medium | Medium |
| Ownership checks | Pending | Very Low | Low |
| Type consolidation | Pending | High | Medium |
| Remove unused props | Pending | Very Low | Low |
| Extract retry logic | Pending | Low | Low |
| Error formatting | Pending | Low | Low |
