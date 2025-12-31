# CLAUDE.md

## Package Manager

Use **bun** exclusively. Never use npm or yarn.

```bash
bun install          # Install dependencies
bun add <pkg>        # Add a dependency
bun add -D <pkg>     # Add a dev dependency
bun run <script>     # Run a script
```

## Linting & Formatting

Use **Biome** for linting and formatting.

```bash
bun run lint         # Run Biome check with auto-fix
bun run typecheck    # TypeScript type checking
```

## Database

Use **Drizzle ORM** for all database operations. Organize queries and mutations in domain-specific files under `src/db/`:

- `src/db/calendar.ts` - calendar queries/mutations
- `src/db/tasks.ts` - task queries/mutations
- `src/db/notes.ts` - note queries/mutations
- `src/db/goals.ts` - goal queries/mutations
- `src/db/whoop.ts` - WHOOP health data queries/mutations

**Important**: All queries that access user data must include `userId` parameter and verify ownership in the WHERE clause using `and(eq(table.id, id), eq(table.userId, userId))`.

## Authentication

Session-based auth in `src/lib/auth/`:
- `session.ts` - Session CRUD with HTTP-only cookies
- `password.ts` - bcrypt password hashing

Use `getUser()` to get current user, `requireUser()` to throw if not authenticated.

## API Routes

All API routes should:
1. Check authentication with `getUser()`
2. Validate input with Zod schemas from `src/lib/validations/`
3. Use `handleApiError()` for consistent error responses
4. Pass `userId` to all database functions for ownership verification

Example pattern:
```typescript
export async function GET() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    const data = await db.getData(user.id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Data Fetching

Use **TanStack Query** for all client-side data fetching. It handles caching, background refetching, and stale data management.

## Never Use RSC for Data

**Never use React Server Components for data fetching.** All pages and components should be client components that fetch data via TanStack Query + API routes. This keeps the architecture simple and consistent.

## Error Handling

Use the `ApiError` class from `src/lib/api/errors.ts`:
- `unauthorized()` - 401 errors
- `notFound(resource)` - 404 errors
- `validationError(message, details)` - 400 errors
- `handleApiError(error)` - Catches and formats all errors

## Validation

Create Zod schemas in `src/lib/validations/` for all API inputs:
- `tasks.ts` - Task schemas
- `calendar.ts` - Calendar event schemas

Always validate request body before processing.

## WHOOP Integration

WHOOP health data integration in `src/lib/whoop.ts`:
- OAuth 2.0 flow with automatic token refresh
- v2 API client for cycles, recovery, sleep, workouts
- Sport ID mapping for 100+ activity types

**Database Tables** (in `src/db/schema.ts`):
- `whoopCycles` - Physiological cycles with strain data
- `whoopRecovery` - Recovery scores, HRV, resting HR, SpO2
- `whoopSleep` - Sleep stages, duration, performance metrics
- `whoopWorkouts` - Workout strain, HR zones, distance
- `whoopProfiles` - Cached user profile and body measurements

**API Routes** (`/api/whoop/`):
- `GET /auth` - Initiate OAuth flow
- `GET /callback` - Handle OAuth callback
- `POST /disconnect` - Disconnect and cleanup data
- `POST /sync` - Sync 30 days of WHOOP data
- `GET /profile`, `/cycles`, `/recovery`, `/sleep`, `/workouts`

**Hooks** (`src/hooks/use-whoop.ts`):
- `useWhoopProfile()`, `useWhoopRecovery()`, `useWhoopCycles()`
- `useWhoopSleep()`, `useWhoopWorkouts()`
- `useWhoopSync()`, `useWhoopDisconnect()`

**Environment Variables**:
```
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_client_secret
```
