# Testing

This repo has three test buckets. Only one of them is reliable without real device data.

## Test layout

```
ios/
├── Tests/MapHealthCoreTests/   # Swift Testing (SPM)
├── MapHealthTests/             # Xcode unit tests
└── MapHealthUITests/           # Xcode UI tests
```

## Run core tests (Swift Testing)

This is the only part that does not care about Xcode or devices.

```bash
cd ios
swift test
```

Background sync is iOS-only. On macOS builds the BackgroundSyncManager is a no-op so SwiftPM tests can run.

## Run Xcode tests

Find a scheme first, then run tests through xcodebuild.

```bash
xcodebuild -list -project MapHealth.xcodeproj

xcodebuild test \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  CODE_SIGNING_ALLOWED=NO
```

## UI tests

```bash
xcodebuild test \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  -only-testing:MapHealthUITests
```

## Feature flags

These are the flags the app actually reads:

- `--skipOnboarding`
- `--showOnboarding`
- `--resetKeychainStorage`
- `--mockMode`

`ios/MapHealth.xctestplan` now uses `--resetKeychainStorage` to match the app flag.

## HealthKit testing

- Simulator has no real HealthKit data.
- Use a physical iPhone for anything HealthKit-related.
- Use mock data paths in previews and tests if you just need UI coverage.
