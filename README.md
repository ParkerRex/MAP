# MAP - Personal Productivity Platform

A personal productivity dashboard integrating calendar, tasks, notes, and health data into one unified interface. Includes a native iOS app for Apple Health sync.

## Features

### Web Dashboard
- **Calendar** - Week view with Google Calendar sync, event management
- **Tasks** - Task management with tags, due dates, and bulk actions
- **Notes** - Folder-organized notes with search
- **Health** - WHOOP integration for recovery, strain, sleep, and workout data
- **Goals** - Goal tracking with completion stats

### iOS App
- **Apple Health Sync** - Pulls 25+ health metrics from HealthKit
- **Background Sync** - Automatically syncs when new health data arrives
- **AI Chat** - Chat with an LLM about your health data (OpenAI or Claude)
- **Sleep Tracking** - Full sleep stage analysis (Core, Deep, REM, Awake)
- **Heart & Recovery** - HRV, resting HR, VO2 Max, respiratory rate
- **Activity** - Steps, distance, exercise time, stand time, flights climbed

## Tech Stack

### Web
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Google-only OAuth (web uses HTTP-only session cookies, iOS uses Bearer tokens)
- **Data Fetching**: TanStack Query + API routes
- **Styling**: Tailwind CSS 4 + Radix UI
- **Validation**: Zod schemas
- **Package Manager**: Bun

### iOS
- **Platform**: iOS 17+ / Swift 5.9
- **UI**: SwiftUI
- **Health**: HealthKit
- **LLM**: OpenAI (device-side, user key)
- **Build**: Xcode 16.2 target + SPM for MapHealthCore

## Getting Started

### Web Dashboard

```bash
# Install dependencies
bun install

# Use the repo's Node version
source ~/.nvm/nvm.sh && nvm use

# Start dev services (Postgres + web)
bun run dev:all

# Public URL via Cloudflare Tunnel (ephemeral)
bun run dev:all -- --tunnel try

# Public URL via named tunnel (stable)
bun run dev:all -- --tunnel named --tunnel-name map-ai
```

Dashboard runs on http://localhost:3000 (or pass `--port`)

The `dev:all` script streams logs from each service in one terminal and shuts
everything down on Ctrl+C.

`dev:all` details:
- Defaults to port 3000 and will exit if the port is already in use (use `--port 3001` or `PORT=3001`).
- Waits for Postgres health checks, then starts Next.js and waits for HTTP readiness.
- `--tunnel off|try|named` controls Cloudflare Tunnel (default `off`).
- `--tunnel-name <name>` sets the named tunnel (default `map-ai`).
- `NEXT_PUBLIC_APP_URL` defaults to `http://localhost:<port>` if not set.

#### Public URL (Cloudflare Tunnel)

Use Cloudflare Tunnel when you need a public URL (OAuth callbacks, mobile device testing).

```bash
# Install cloudflared (macOS)
brew install cloudflared

# Start tunnel to local dev server (quick, ephemeral URL)
cloudflared tunnel --url http://localhost:3000

# Start named tunnel (stable URL)
cloudflared tunnel run map-ai
```

- For the ephemeral URL: copy the `https://*.trycloudflare.com` URL and set it in
  `.env.local` as `NEXT_PUBLIC_APP_URL=https://<your-tunnel-url>`.
- For a named tunnel: set `NEXT_PUBLIC_APP_URL` to the hostname you configured
  in Cloudflare (e.g. `https://map-ai.yourdomain.com`).
- Restart `bun run dev` after changing `NEXT_PUBLIC_APP_URL`.
- Update Google/WHOOP OAuth redirect URIs to match the tunnel URL.
- For a named tunnel, ensure the tunnel exists and is configured to route to
  `http://localhost:<port>` before running `cloudflared tunnel run <name>`.

### iOS App

```bash
cd ios

# Build MapHealthCore only
swift build

# Build/run the app target
open MapHealth.xcodeproj
```

**Requirements:** Xcode 16.2+, physical iOS device (HealthKit requires real device)

## Project Structure

```
src/                            # Web Dashboard
├── app/                        # Next.js pages + API routes
│   ├── api/                    # REST API endpoints
│   ├── calendar/               # Calendar page
│   ├── tasks/                  # Tasks page
│   ├── notes/                  # Notes page
│   ├── health/                 # Health dashboard
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   └── settings/               # Settings page
├── components/
│   ├── calendar/               # Calendar components
│   ├── tasks/                  # Task components
│   ├── notes/                  # Note components
│   └── ui/                     # Radix UI primitives
├── db/                         # Drizzle ORM queries
├── hooks/                      # React Query hooks
│   ├── use-auth.ts             # Authentication
│   ├── use-calendar.ts         # Calendar data
│   ├── use-tasks.ts            # Tasks data
│   ├── use-notes.ts            # Notes data
│   └── use-whoop.ts            # WHOOP health data
├── lib/
│   ├── api/                    # API client + error handling
│   ├── auth/                   # Session management
│   └── validations/            # Zod schemas
└── types/                      # TypeScript types

ios/                            # iOS App
├── Sources/MapHealthCore/      # Shared library
│   ├── HealthKit/              # HealthKit queries
│   ├── Services/               # API client, background sync
│   └── Models/                 # Data models
├── MapHealth/                  # SwiftUI app target (Xcode)
├── MapHealth.xcodeproj         # Xcode project
├── Tests/MapHealthCoreTests/   # Swift Testing
├── MapHealthTests/             # Xcode unit tests
└── MapHealthUITests/           # Xcode UI tests
```

## Authentication

Google-only OAuth for both web and iOS. Web sessions use HTTP-only cookies; iOS sends
`Authorization: Bearer <session>` and stores the token in Keychain.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/google` | GET | Initiate Google Sign-In (includes calendar scopes) |
| `/api/auth/google/callback` | GET | OAuth callback |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Get current user |

Sessions are stored in the database with a 30-day sliding expiry.

## Integrations

### Google Calendar

OAuth 2.0 integration for calendar sync. Calendar OAuth is handled by the unified Google Sign-In flow.

**Setup:**
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add redirect URI: `{APP_URL}/api/auth/google/callback`
3. Set environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

**Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/google/status` | GET | Check if calendar is connected |
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

All routes require authentication except public pages (`/`, `/login`, `/signup`, `/auth/error`)
and the Google OAuth endpoints. Resources verify ownership via userId.

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

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# WHOOP
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_client_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
