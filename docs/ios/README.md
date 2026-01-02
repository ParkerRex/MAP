# iOS Documentation

Documentation for the Map Health iOS app.

## Contents

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Module structure, data flow, and design patterns |
| [CLI Development](./cli-development.md) | Building and testing without Xcode IDE |
| [Device Deployment](./device-deployment.md) | Deploying to physical iPhone from command line |
| [HealthKit Integration](./healthkit.md) | Health data fetching and processing |
| [LLM Integration](./llm.md) | AI chat configuration (OpenAI) |
| [Testing](./testing.md) | Unit tests, UI tests, and test strategies |

## Quick Start

```bash
cd ios

# Verify SPM structure
swift package describe

# Build for simulator
xcodebuild build -scheme MapHealth -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15"

# Deploy to device
./scripts/deploy.sh
```

## Project Overview

Map Health is a native iOS app that:

1. **Syncs Apple Health data** to the Map backend
2. **Provides AI chat** about your health metrics
3. **Runs background sync** when new health data arrives
4. **Authenticates with Google Sign-In** and stores the session token in Keychain

### Technology Stack

- **Swift 5.9+** with SwiftUI
- **HealthKit** for Apple Health integration
- **OpenAI HTTP API** for AI chat

### Module Structure

```
MapHealthCore (Library)     MapHealthApp (App Shell)
├── Models                  ├── Views
├── Services                ├── Onboarding
├── HealthKit               └── Resources
├── Helpers
└── SharedContext
```
