# Map Health iOS

Native iOS app for syncing Apple Health data to the Map backend.

---

## ⚠️ REQUIRED: Complete Xcode Project Migration

> **The iOS project has been migrated to Swift Package Manager structure.**
> You must complete the following steps in Xcode before the app will build.

### Manual Steps Required

1. **Open `MapHealth.xcodeproj` in Xcode**

2. **Remove missing file references** (they'll appear red)
   - Delete all red file references from the project navigator
   - These are the old file locations that no longer exist

3. **Add new source files to MapHealth target**
   - Right-click MapHealth target → Add Files to "MapHealth"
   - Navigate to `Sources/MapHealthApp/`
   - Select all files and folders
   - Ensure "Add to targets: MapHealth" is checked

4. **Add MapHealthCore as a local package dependency**
   - File → Add Package Dependencies
   - Click "Add Local..."
   - Select the `ios/` folder (contains Package.swift)
   - Add `MapHealthCore` to the MapHealth target

5. **Verify Info.plist and Entitlements**
   - Build Settings → Info.plist File: `MapHealth/Supporting Files/Info.plist`
   - Build Settings → Code Signing Entitlements: `MapHealth/Supporting Files/MapHealth.entitlements`

6. **Build and run** to verify everything works

---

## Project Structure (SPM)

```
ios/
├── Package.swift                    # SPM manifest
├── Sources/
│   ├── MapHealthCore/              # Pure Swift library (testable)
│   │   ├── Models/                 # HealthData, LLMSource
│   │   ├── Services/               # MapAPIClient, BackgroundSync
│   │   ├── HealthKit/              # HealthDataFetcher, Interpreter
│   │   ├── Helpers/                # Extensions
│   │   └── SharedContext/          # StorageKeys, FeatureFlags
│   └── MapHealthApp/               # SwiftUI app shell
│       ├── Views/                  # HealthChatView, SettingsView
│       ├── Onboarding/             # Full onboarding flow
│       └── Resources/              # Localizable.xcstrings
├── Tests/
│   └── MapHealthCoreTests/         # Unit tests
├── MapHealth/
│   └── Supporting Files/           # Info.plist, entitlements
├── MapHealth.xcodeproj/            # Xcode project (for device builds)
├── MapHealthUITests/               # UI tests
└── scripts/
    └── deploy.sh                   # CLI device deployment
```

## Features

- **Full HealthKit Integration** - Pulls 25+ health metrics from Apple Health
- **Background Sync** - Automatically syncs data when new health data arrives
- **AI Chat** - Chat with an LLM about your health data (OpenAI/Local Llama/Fog)
- **Sleep Tracking** - Full sleep stage analysis (Core, Deep, REM, Awake)
- **Heart & Recovery** - HRV, resting HR, VO2 Max, respiratory rate
- **Activity** - Steps, distance, exercise time, stand time, flights climbed
- **Body Metrics** - Weight, body fat %, lean mass

## Requirements

- Xcode 16.2+
- iOS 17.0+
- Physical device (HealthKit requires real device, not simulator)

## CLI Commands

```bash
# Verify package structure
swift package describe

# Build MapHealthCore for simulator
xcodebuild build -scheme MapHealthCore -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15"

# Build full app for simulator
xcodebuild build -scheme MapHealth -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15"

# Run unit tests
xcodebuild test -scheme MapHealthCore -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  CODE_SIGNING_ALLOWED=NO

# Deploy to physical device
./scripts/deploy.sh
```

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

## Backend API

The app syncs to these endpoints:

- `POST /api/health/apple-health/sync` - Upload health data
- `GET /api/health/apple-health/status` - Check connection status

## Dependencies (Spezi Framework)

- [Spezi](https://github.com/StanfordSpezi/Spezi) - Core framework
- [SpeziHealthKit](https://github.com/StanfordSpezi/SpeziHealthKit) - HealthKit abstraction
- [SpeziLLM](https://github.com/StanfordSpezi/SpeziLLM) - LLM orchestration (OpenAI, Local, Fog)
- [SpeziChat](https://github.com/StanfordSpezi/SpeziChat) - Chat UI
- [SpeziOnboarding](https://github.com/StanfordSpezi/SpeziOnboarding) - Onboarding flows
- [SpeziStorage](https://github.com/StanfordSpezi/SpeziStorage) - Keychain storage

## Documentation

See [docs/ios/](../docs/ios/) for detailed documentation:

- [Architecture](../docs/ios/architecture.md) - Module structure and data flow
- [CLI Development](../docs/ios/cli-development.md) - Building without Xcode IDE
- [Device Deployment](../docs/ios/device-deployment.md) - Physical iPhone deployment
- [HealthKit Integration](../docs/ios/healthkit.md) - Health data fetching
- [LLM Integration](../docs/ios/llm.md) - AI chat configuration

## License

MIT
