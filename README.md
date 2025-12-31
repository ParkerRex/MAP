# MAP - Personal Productivity Platform

A personal productivity dashboard integrating calendar, tasks, notes, and health data into one unified interface.

## Features

- **Calendar** - Week view with Google Calendar sync, event management
- **Tasks** - Task management with tags, due dates, and bulk actions
- **Notes** - Folder-organized notes with search
- **Health** - WHOOP integration for recovery, strain, sleep, and workout data
- **Goals** - Goal tracking with completion stats

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based with HTTP-only cookies
- **Data Fetching**: TanStack Query + API routes
- **Styling**: Tailwind CSS 4 + Radix UI
- **Validation**: Zod schemas
- **Package Manager**: Bun

## Getting Started

```bash
# Start Docker services (Postgres)
docker-compose up -d

# Install dependencies
bun install

# Push database schema
bun run db:push

# Start dev server
bun run dev
```

Dashboard runs on http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js pages + API routes
│   ├── api/                # REST API endpoints
│   ├── calendar/           # Calendar page
│   ├── tasks/              # Tasks page
│   ├── notes/              # Notes page
│   ├── health/             # Health dashboard
│   ├── login/              # Login page
│   └── signup/             # Signup page
├── components/
│   ├── calendar/           # Calendar components
│   ├── tasks/              # Task components
│   ├── notes/              # Note components
│   └── ui/                 # Radix UI primitives
├── db/                     # Drizzle ORM queries
├── hooks/                  # React Query hooks
│   ├── use-auth.ts         # Authentication
│   ├── use-calendar.ts     # Calendar data
│   ├── use-tasks.ts        # Tasks data
│   ├── use-notes.ts        # Notes data
│   └── use-whoop.ts        # WHOOP health data
├── lib/
│   ├── api/                # API client + error handling
│   ├── auth/               # Session management
│   └── validations/        # Zod schemas
└── types/                  # TypeScript types
```

## Authentication

Email/password authentication with session cookies:

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Get current user |

Sessions stored in database with 30-day expiry. Passwords hashed with bcrypt.

## Integrations

### Google Calendar

OAuth 2.0 integration for calendar sync.

**Setup:**
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add redirect URI: `{APP_URL}/api/google/callback`
3. Set environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

**Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/google/auth` | GET | Initiate OAuth |
| `/api/google/callback` | GET | OAuth callback |
| `/api/google/status` | GET | Connection status |
| `/api/calendar/sync` | POST | Sync calendars |
| `/api/calendar/events` | GET, POST | List/create events |
| `/api/calendar/events/[id]` | PUT, DELETE | Update/delete event |

### WHOOP

OAuth 2.0 integration for health/fitness data.

**Setup:**
1. Create app in [WHOOP Developer Portal](https://developer.whoop.com/)
2. Add redirect URI: `{APP_URL}/api/whoop/callback`
3. Set environment variables:
   ```
   WHOOP_CLIENT_ID=your_client_id
   WHOOP_CLIENT_SECRET=your_client_secret
   ```

**Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/whoop/auth` | GET | Initiate OAuth |
| `/api/whoop/callback` | GET | OAuth callback |
| `/api/whoop/sync` | POST | Sync health data |
| `/api/whoop/profile` | GET | User profile |
| `/api/whoop/recovery` | GET | Recovery scores |
| `/api/whoop/sleep` | GET | Sleep data |
| `/api/whoop/cycles` | GET | Strain cycles |
| `/api/whoop/workouts` | GET | Workout data |
| `/api/whoop/disconnect` | POST | Disconnect account |

## API Routes

All routes require authentication. Resources verify ownership via userId.

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/tasks` | GET, POST | List/create tasks |
| `/api/tasks/[id]` | GET, PUT, DELETE | Single task |
| `/api/tasks/bulk` | PUT, DELETE | Bulk operations |
| `/api/tags` | GET, POST | List/create tags |
| `/api/tags/[id]` | PUT, DELETE | Single tag |
| `/api/notes` | GET, POST | List/create notes |
| `/api/notes/[id]` | GET, PUT, DELETE | Single note |
| `/api/notes/[id]/duplicate` | POST | Duplicate note |
| `/api/folders` | GET, POST | List/create folders |
| `/api/folders/[id]` | PUT, DELETE | Single folder |
| `/api/goals` | GET, POST, DELETE | List/create/delete all goals |
| `/api/goals/[id]` | PUT, DELETE | Single goal |
| `/api/goals/stats` | GET | Goal statistics |

## Scripts

```bash
bun run dev        # Start dev server
bun run build      # Build for production
bun run lint       # Lint with Biome
bun run typecheck  # TypeScript check
bun run db:push    # Push schema to database
bun run db:studio  # Open Drizzle Studio
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://...

# Auth
SESSION_SECRET=your_session_secret

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# WHOOP
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_client_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
