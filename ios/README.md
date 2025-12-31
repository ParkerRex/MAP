# Map Health iOS

Native iOS app for syncing Apple Health data to the Map backend.

## Features

- **Full HealthKit Integration** - Pulls 25+ health metrics from Apple Health
- **Background Sync** - Automatically syncs data when new health data arrives
- **AI Chat** - Chat with an LLM about your health data (OpenAI/Local Llama)
- **Sleep Tracking** - Full sleep stage analysis (Core, Deep, REM, Awake)
- **Heart & Recovery** - HRV, resting HR, VO2 Max, respiratory rate
- **Activity** - Steps, distance, exercise time, stand time, flights climbed
- **Body Metrics** - Weight, body fat %, lean mass

## Requirements

- Xcode 16.2+
- iOS 17.0+
- Physical device (HealthKit requires real device, not simulator)

## Setup

1. Open `MapHealth.xcodeproj` in Xcode
2. Wait for Swift packages to resolve
3. Select your development team in Signing & Capabilities
4. Build and run on a physical iOS device

## Data Types Collected

### Activity
- Step count
- Distance (walking/running, cycling)
- Active/Basal energy burned
- Exercise time
- Stand time
- Flights climbed

### Heart & Recovery
- Heart rate (resting, walking average)
- HRV (SDNN)
- VO2 Max
- Oxygen saturation (SpO2)
- Respiratory rate

### Sleep (8 Sleep compatible)
- Total sleep duration
- Sleep stages (Core, Deep, REM, Awake)
- Time in bed

### Body
- Weight
- Body fat percentage
- Lean body mass

## Architecture

```
MapHealth/
├── MapHealthApp.swift          # App entry point
├── MapHealthAppDelegate.swift  # Spezi configuration + HealthKit setup
├── MapHealthStandard.swift     # HealthKit data handler
├── Health/
│   ├── HealthDataFetcher.swift       # HealthKit queries
│   ├── HealthDataFetcher+Process.swift
│   ├── HealthData.swift              # Data models
│   ├── HealthDataInterpreter.swift   # LLM context builder
│   ├── HealthChatView.swift          # Main chat UI
│   ├── SettingsView.swift
│   └── PromptGenerator.swift
├── Services/
│   ├── MapAPIClient.swift      # Backend sync client
│   └── BackgroundSync.swift    # Background task management
├── Onboarding/
│   ├── OnboardingFlow.swift
│   ├── HealthKitPermissions.swift
│   └── ...
└── SharedContext/
    ├── StorageKeys.swift
    └── FeatureFlags.swift
```

## Backend API

The app syncs to these endpoints:

- `POST /api/health/apple-health/sync` - Upload health data
- `GET /api/health/apple-health/status` - Check connection status

## Dependencies (Spezi Framework)

- [Spezi](https://github.com/StanfordSpezi/Spezi) - Core framework
- [SpeziHealthKit](https://github.com/StanfordSpezi/SpeziHealthKit) - HealthKit abstraction
- [SpeziLLM](https://github.com/StanfordSpezi/SpeziLLM) - LLM orchestration
- [SpeziChat](https://github.com/StanfordSpezi/SpeziChat) - Chat UI
- [SpeziOnboarding](https://github.com/StanfordSpezi/SpeziOnboarding) - Onboarding flows

## License

MIT
