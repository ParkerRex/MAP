# Map iOS Docs

This is the iOS client for the Map backend (app.map.ai). It is not a standalone app.

## Reality check

- No backend, no app. Most screens are useless without a live Map API session.
- HealthKit is device-only. The simulator does not give you real health data.
- The app never ships with LLM keys. Users bring their own OpenAI key.

## What the app actually does

- Google OAuth in a web auth session, stores the session token in Keychain.
- Syncs Apple Health metrics to the Map backend.
- Reads/writes tasks and calendar data via Map API.
- Chat UI that calls OpenAI directly or Claude via the Map backend.

## Service specifics (hardcoded)

- DEBUG base URL: `https://mapyourlife.org`
- Release base URL: `https://app.map.ai`
- OAuth start: `/api/auth/google?platform=ios`
- Profile: `/api/auth/me`
- Health sync: `/api/health/apple-health/sync`
- Health status: `/api/health/apple-health/status`
- Tasks/tags: `/api/tasks`, `/api/tags`
- Calendar: `/api/calendar/calendars`, `/api/calendar/events`, `/api/calendar/colors`, `/api/calendar/sync`
- Claude backend: `/api/claude/key`, `/api/claude/status`, `/api/claude/chat`, `/api/claude/disconnect`

If you need a different backend host, edit `ios/MapHealth/AppConfig.swift`. There is no runtime env switch.

## Quick start (CLI)

```bash
cd ios

# Do not guess scheme names
xcodebuild -list -project MapHealth.xcodeproj

# Build the app (simulator)
xcodebuild build \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15"

# Run core tests (Swift package)
swift test

# Deploy to device
./scripts/deploy.sh
```

## Docs

- [Architecture](./architecture.md) - App layers, data flow, backend contracts
- [CLI Development](./cli-development.md) - Build/test without Xcode UI
- [Device Deployment](./device-deployment.md) - Physical iPhone install/launch
- [HealthKit Integration](./healthkit.md) - Health data fetching + sync
- [LLM Integration](./llm.md) - OpenAI + Claude specifics
- [Testing](./testing.md) - Unit/UI tests and flags
