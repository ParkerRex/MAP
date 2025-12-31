# Map - Personal Productivity Platform

A personal productivity dashboard with calendar, notes, tasks, and more.

## Architecture

Single Next.js app with:
- **Database**: PostgreSQL with Drizzle ORM (Docker)
- **Cache**: Redis with ioredis (Docker)
- **Auth**: Disabled for dev (hardcoded dev user)
- **Data fetching**: TanStack Query + API routes
- **State**: React Context only (no external state libraries)

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
src/
├── app/           # Next.js app router pages + API routes
├── components/    # React components
│   └── ui/        # Shadcn UI components
├── db/            # Drizzle ORM queries/mutations
├── hooks/         # React hooks (TanStack Query)
├── lib/           # Utilities, API client, query keys
├── services/      # External service integrations
└── types/         # TypeScript types
```

## Data Flow

```
UI Components
    ↓
Custom Hooks (use-tasks, use-notes, use-calendar, use-goals)
    ↓
TanStack Query (useQuery/useMutation)
    ↓
API Routes (/api/*)
    ↓
Drizzle ORM (src/db/*)
    ↓
PostgreSQL
```
