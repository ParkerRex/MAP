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

Use **ESLint** for linting and **Biome** for formatting.

```bash
bun run lint         # Run ESLint
bun run format       # Format with Biome
bun run check        # Run Biome check (lint + format)
```

## Database

Use **Drizzle ORM** for all database operations. Organize queries and mutations in domain-specific files under `src/db/`:

- `src/db/calendar.ts` - calendar queries/mutations
- `src/db/tasks.ts` - task queries/mutations
- `src/db/notes.ts` - note queries/mutations
- etc.

Each domain file handles all DB operations for that feature. Keep it simple and colocated.

## Data Fetching

Use **TanStack Query** for all client-side data fetching. It handles caching, background refetching, and stale data management.

## API Layer

Use Next.js **API Route Handlers** (`src/app/api/`) to expose data to the client. The flow is:

```
Client (TanStack Query) -> API Route Handler -> Drizzle DB functions
```

## Never Use RSC

**Never use React Server Components for data fetching.** All pages and components should be client components that fetch data via TanStack Query + API routes. This keeps the architecture simple and consistent.
