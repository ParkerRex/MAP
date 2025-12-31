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

## Integrations

### Google Calendar

OAuth 2.0 integration for syncing Google Calendar events.

**Setup:**
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized redirect URI: `{APP_URL}/api/google/callback`
3. Set environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

**User Flow:**
1. Visit `/calendar` → Shows "Connect Google Calendar" card
2. Click connect → Redirects to Google OAuth consent
3. Approve → Redirects back, auto-syncs calendars
4. View and manage calendar events

**OAuth Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/google/auth` | GET | Initiates OAuth flow |
| `/api/google/callback` | GET | Handles OAuth callback |
| `/api/google/status` | GET | Check if connected |

### WHOOP

OAuth 2.0 integration for health/fitness data (recovery, strain, sleep).

**OAuth Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/whoop/auth` | GET | Initiates OAuth flow |
| `/api/whoop/callback` | GET | Handles OAuth callback |
| `/api/whoop/profile` | GET | Check connection status |

## API Routes

All API routes require authentication (except auth routes). Protected resources verify ownership via userId.

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/auth/*` | POST/GET | Authentication |
| `/api/google/*` | GET | Google Calendar OAuth |
| `/api/whoop/*` | GET | WHOOP OAuth |
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
| `/api/calendar/*` | Various | Google Calendar sync & events |

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
