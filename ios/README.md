# Map iOS

This is the iOS client for the Map backend (app.map.ai). It is not a standalone health app.

## Reality check

- No backend, no app. You need a live Map API session.
- HealthKit requires a physical iPhone.
- Chat requires a user-provided OpenAI key.

## Project structure

```
ios/
├── Sources/MapHealthCore/         # SPM library (models, services, HealthKit)
├── MapHealth/                     # SwiftUI app target (Xcode)
├── MapHealth.xcodeproj            # Device builds + signing
├── Tests/MapHealthCoreTests/      # Swift Testing (SPM)
├── MapHealthTests/                # Xcode unit tests
├── MapHealthUITests/              # Xcode UI tests
└── scripts/deploy.sh              # Device deployment helper
```

## What the app does

- Google OAuth sign-in and token storage in Keychain.
- Apple Health sync to Map backend.
- Tasks + calendar CRUD via Map API.
- Chat UI that calls OpenAI directly or Claude via the Map backend.

## Backend endpoints (used by iOS)

- `/api/auth/google?platform=ios`
- `/api/auth/me`
- `/api/health/apple-health/sync`
- `/api/health/apple-health/status`
- `/api/tasks`, `/api/tags`
- `/api/calendar/calendars`, `/api/calendar/events`, `/api/calendar/colors`, `/api/calendar/sync`

Base URLs are hardcoded in `ios/MapHealth/AppConfig.swift`:

- DEBUG: `https://mapyourlife.org`
- Release: `https://app.map.ai`

## Build + test (CLI)

```bash
cd ios

# Find scheme names
xcodebuild -list -project MapHealth.xcodeproj

# Build app (simulator)
xcodebuild build \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15"

# Core tests
swift test

# UI tests
xcodebuild test \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  -only-testing:MapHealthUITests
```

## Docs

See `docs/ios/` for architecture, HealthKit, LLM, testing, and deployment.
