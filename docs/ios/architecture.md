# iOS Architecture (Map)

## Layers

- **MapHealthCore (SPM library)**: business logic, HealthKit, API clients, models.
- **MapHealth app target (Xcode)**: SwiftUI UI, onboarding, tabs.

The UI is not in SPM. It lives in the Xcode target under `ios/MapHealth/`.

## Directory map

```
ios/
├── Sources/
│   └── MapHealthCore/
│       ├── Models/              # HealthData, task/calendar models, LLM source
│       ├── Services/            # MapAPIClient, TasksService, CalendarService, ClaudeAPIClient
│       ├── HealthKit/            # HealthDataFetcher, PromptGenerator, HealthDataInterpreter
│       ├── Helpers/             # Extensions + utilities
│       └── SharedContext/        # FeatureFlags, StorageKeys
├── MapHealth/                    # SwiftUI app target (Xcode)
│   ├── Views/                    # Main tabs, chat, calendar, todos
│   ├── Onboarding/               # Google auth, OpenAI key, model selection, HealthKit perms
│   └── Supporting Files/         # Info.plist, entitlements, assets
├── Tests/                        # Swift Testing (MapHealthCore)
├── MapHealthTests/               # Xcode unit tests
├── MapHealthUITests/             # Xcode UI tests
└── MapHealth.xcodeproj
```

## Backend contracts (Map API)

- Base URL: DEBUG `https://mapyourlife.org`, Release `https://app.map.ai`
- OAuth start: `/api/auth/google?platform=ios` (returns `token` in callback URL)
- Session token stored in Keychain, sent as `Authorization: Bearer <token>`
- 401s trigger re-auth via `MapAPIClient.onAuthenticationRequired`

Key endpoints used by iOS:

- `/api/auth/me` (profile)
- `/api/health/apple-health/sync` and `/api/health/apple-health/status`
- `/api/tasks`, `/api/tags`
- `/api/calendar/calendars`, `/api/calendar/events`, `/api/calendar/colors`, `/api/calendar/sync`
- `/api/claude/*` (Claude key, status, chat, disconnect)

## Data flows

### Health sync

```
Apple Health -> HealthDataFetcher -> [HealthData]
                            -> MapAPIClient.syncHealthData
                            -> POST /api/health/apple-health/sync
```

### Chat (OpenAI)

```
HealthDataFetcher -> PromptGenerator -> system prompt
User message -> HealthDataInterpreter -> OpenAIClient
               -> https://api.openai.com/v1/chat/completions
```

### Tasks + Calendar

```
TasksService / CalendarService -> MapAPIClient -> Map backend
```

## Key classes

- `MapAPIClient`: Map backend HTTP client. Handles auth token + retries.
- `TasksService`: task CRUD + local caching.
- `CalendarService`: calendar fetch, selection, event CRUD, sync.
- `HealthDataFetcher`: HealthKit queries (last 14 days).
- `HealthDataInterpreter`: OpenAI chat orchestration + prompt building.
- `BackgroundSyncManager`: iOS background delivery + sync scheduling (no-op on macOS builds).
- `ClaudeAPIClient`: Claude chat through Map backend.

## Feature flags (command-line)

- `--skipOnboarding`
- `--showOnboarding`
- `--resetKeychainStorage`
- `--mockMode`
