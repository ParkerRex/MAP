# Map - Personal Productivity Platform

A personal productivity dashboard with calendar, notes, tasks, and more.

## Architecture

Single Next.js 16 app with:
- **Database**: PostgreSQL with Drizzle ORM (Docker)
- **Cache**: Redis with ioredis (Docker)
- **Auth**: Disabled for dev (hardcoded dev user)
- **Data fetching**: TanStack Query + API routes (in progress)

## Current Status

### Completed
- Consolidated monorepo into single dashboard app
- Removed all server actions (`src/actions/`)
- Removed AI/chat/assistant components (deprecated `ai/rsc`)
- Removed activities (Whoop) components
- Removed storybook files
- Fixed imports to use local paths instead of workspace packages
- Dev server starts successfully

### In Progress
- ~148 type errors remain (mostly implicit `any` types and Drizzle schema mismatches)
- Architecture ready for API routes + TanStack Query

### Next Steps
1. Create API routes in `/api/*` for mutations
2. Create TanStack Query hooks in `/hooks/` for data fetching
3. Fix remaining type issues (Drizzle schema camelCase vs snake_case)
4. Update components to use new hooks

## Getting Started

```bash
# Start Docker services (Postgres + Redis)
docker-compose up -d

# Install dependencies
bun install

# Start dev server
bun run dev
```

Dashboard runs on http://localhost:3001

## Project Structure

```
apps/dashboard/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   │   └── ui/        # Shadcn UI components
│   ├── lib/
│   │   ├── db/        # Drizzle ORM setup
│   │   └── kv/        # Redis client
│   ├── hooks/         # React hooks
│   ├── store/         # Zustand stores
│   └── types/         # TypeScript types
├── docker-compose.yml
└── package.json
```
