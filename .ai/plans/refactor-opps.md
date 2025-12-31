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

### 6. ✅ DRY Up Database Task Mapping
**Status:** Complete

Extracted shared `taskWithTagsSelect` constant and `rowsToTaskWithTags()` helper function in `src/db/tasks.ts`. Reduced duplicate 23-field SELECT clauses from 2 locations to 1 shared constant.

---

### 7. ✅ Move Stats Calculation to SQL
**Status:** Complete

Replaced JS filtering with SQL aggregation in `src/db/goals.ts`:
```typescript
const result = await db
  .select({
    total: count(),
    completed: sql<number>`count(*) filter (where ${goals.completed} = true)`,
  })
  .from(goals)
  .where(eq(goals.userId, userId));
```

---

### 8. ✅ Remove Redundant Ownership Checks
**Status:** Complete

Refactored delete operations in `src/db/tasks.ts` and `src/db/notes.ts` to:
1. Delete entity first (with ownership in WHERE clause)
2. Clean up associations only if delete succeeded

This eliminates redundant pre-delete ownership queries while maintaining correctness.

---

## Lower Priority - Cleanup (Completed)

### 9. ✅ Type Definition Consolidation
**Status:** Complete

Created `src/types/tasks.ts` with Task, Tag, and TaskWithTags types. Established clear hierarchy:
- `src/db/schema.ts` - DB entity types (source of truth)
- `src/types/*.ts` - Domain types that extend/re-export DB types
- `src/lib/api/client.ts` - imports from types, re-exports for consumers

---

### 10. ✅ Remove Unused Props
**Status:** Complete

Removed unused `selectedFolderId` and `setSelectedNote` props from `NoteDisplay` component and its caller in `folder-bar.tsx`.

---

### 11. ✅ Extract Retry Logic
**Status:** Complete

Created `src/lib/api/retry.ts` with:
- `sleep(ms)` - delay helper
- `isRateLimitError(error)` - checks for HTTP 429
- `getRetryDelay(error, attempt)` - exponential backoff with Retry-After header support
- `withRetry(fn, context)` - retry wrapper with rate limit handling

Updated calendar sync route to use the extracted module.

---

### 12. ✅ Standardize Error Detail Formatting
**Status:** Complete

Standardized all validation error responses to use `parsed.error.flatten().fieldErrors` instead of `parsed.error.flatten()`.

---

## Summary

| Refactor | Status | Effort | Impact |
|----------|--------|--------|--------|
| Auth wrapper | ✅ Done | Low | High |
| Use Zod schemas | ✅ Done | Low | Medium |
| Constants file | ✅ Done | Very Low | Low |
| Standardize hooks | ✅ Done | Medium | Medium |
| Mutation factory | ✅ Done | High | High |
| DRY DB mapping | ✅ Done | Low | Low |
| SQL aggregation | ✅ Done | Medium | Medium |
| Ownership checks | ✅ Done | Very Low | Low |
| Type consolidation | ✅ Done | High | Medium |
| Remove unused props | ✅ Done | Very Low | Low |
| Extract retry logic | ✅ Done | Low | Low |
| Error formatting | ✅ Done | Low | Low |
