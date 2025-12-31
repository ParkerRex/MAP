# Map - Personal Productivity Platform

A personal productivity dashboard with calendar, notes, tasks, and goals.

## Architecture

Single Next.js app with:
- **Database**: PostgreSQL with Drizzle ORM (Docker on port 5434)
- **Cache**: Redis with ioredis (Docker on port 6380)
- **Auth**: Session-based with HTTP-only cookies (bcrypt password hashing)
- **Data fetching**: TanStack Query + API routes
- **Validation**: Zod schemas for all API inputs

## Getting Started

```bash
# Start Docker services (Postgres + Redis)
docker-compose up -d

# Install dependencies
bun install

# Push database schema
bun run db:push

# Start dev server
bun run dev
```

Dashboard runs on http://localhost:3001

## Authentication

Simple email/password authentication:
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

Sessions stored in database with 30-day expiry. Passwords hashed with bcrypt (12 rounds).

## Project Structure

```
src/
├── app/              # Next.js app router pages + API routes
│   ├── api/          # API route handlers
│   ├── login/        # Login page
│   └── signup/       # Signup page
├── components/       # React components
│   └── ui/           # Shadcn UI components
├── db/               # Drizzle ORM queries/mutations
├── hooks/            # React hooks (TanStack Query)
├── lib/
│   ├── api/          # API client, error handling
│   ├── auth/         # Session & password utilities
│   └── validations/  # Zod schemas
└── types/            # TypeScript types
```

## API Routes

All API routes require authentication (except auth routes). Protected resources verify ownership via userId.

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/auth/*` | POST/GET | Authentication |
| `/api/tasks` | GET, POST | Tasks CRUD |
| `/api/tasks/[id]` | GET, PUT, DELETE | Single task |
| `/api/notes` | GET, POST | Notes CRUD |
| `/api/notes/[id]` | GET, PUT, DELETE | Single note |
| `/api/goals` | GET, POST, DELETE | Goals CRUD |
| `/api/goals/[id]` | PUT, DELETE | Single goal |
| `/api/folders` | GET, POST | Folders CRUD |
| `/api/folders/[id]` | PUT, DELETE | Single folder |
| `/api/tags` | GET, POST | Tags CRUD |
| `/api/tags/[id]` | PUT, DELETE | Single tag |
| `/api/calendar/*` | Various | Google Calendar integration |

## Data Flow

```
UI Components
    ↓
Custom Hooks (use-tasks, use-notes, use-calendar, use-goals)
    ↓
TanStack Query (useQuery/useMutation)
    ↓
API Routes (/api/*) → Zod validation → Auth check
    ↓
Drizzle ORM (src/db/*) → Ownership verification
    ↓
PostgreSQL
```

## Scripts

```bash
bun run dev        # Start dev server
bun run build      # Build for production
bun run lint       # Lint with Biome
bun run typecheck  # TypeScript check
bun run db:push    # Push schema to database
bun run db:studio  # Open Drizzle Studio
```
