# Swift Package Manager for iOS Development

> **Status**: Research Complete
> **Last Updated**: 2024-12-31
> **Goal**: Enable CLI-based iOS development without Xcode IDE dependency

---

## Executive Summary

Swift Package Manager (SPM) can significantly reduce our reliance on Xcode IDE for iOS development. While `swift build` doesn't natively support iOS yet, `xcodebuild` can work directly with `Package.swift` files—no `.xcodeproj` required for building and testing.

**Key finding**: Apple open-sourced Xcode's build engine ("Swift Build") in February 2025, which will eventually enable true `swift build` support for iOS.

---

## Current State: What Works

### CLI Commands (No Xcode IDE Needed)

| Task | Command | Works? |
|------|---------|--------|
| List schemes | `xcodebuild -list` | ✅ |
| Build for simulator | `xcodebuild build -scheme X -sdk iphonesimulator` | ✅ |
| Run tests | `xcodebuild test -scheme X -sdk iphonesimulator -destination "..."` | ✅ |
| `swift build` | `swift build` | ❌ macOS/Linux only |
| `swift test` | `swift test` | ❌ macOS/Linux only |

### Requirements

- **Xcode Command Line Tools** - Required (contains `xcodebuild`, SDKs, simulators)
- **Xcode IDE** - Not required for build/test, only for:
  - Code signing configuration
  - Device provisioning
  - App Store submission
  - Visual debugging

---

## Testing iOS Packages from CLI

### Basic Test Command

```bash
# No .xcodeproj needed - works directly with Package.swift
xcodebuild test \
  -scheme MapHealth \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15,OS=17.0" \
  CODE_SIGNING_ALLOWED=NO
```

### List Available Simulators

```bash
xcrun simctl list devices available
```

### Build Only (No Tests)

```bash
xcodebuild build \
  -scheme MapHealth \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15"
```

### Pretty Output with xcbeautify

```bash
# Install
brew install xcbeautify

# Use
xcodebuild test -scheme MapHealth ... | xcbeautify
```

---

## Deploying to Physical iPhone from CLI

HealthKit requires a real device for testing (simulator has no health data). Here's how to build and deploy entirely from command line.

### Requirements

| Requirement | How to Get |
|-------------|------------|
| Xcode CLI tools | `xcode-select --install` |
| Apple Developer account | developer.apple.com (free works for dev) |
| Device registered | One-time Xcode setup or `xcrun devicectl` |
| Developer Mode on iPhone | Settings → Privacy & Security → Developer Mode |
| Device connected via USB | Or WiFi after initial pairing |

### Tools Overview

| Tool | iOS Version | Purpose |
|------|-------------|---------|
| `xcrun devicectl` | iOS 17+ (Xcode 15+) | Apple's official CLI for devices |
| `ios-deploy` | iOS < 17 | Community tool, deprecated for iOS 17+ |
| `ideviceinstaller` | All | libimobiledevice, cross-platform |

### Using xcrun devicectl (Recommended - iOS 17+)

```bash
# 1. List connected devices
xcrun devicectl list devices

# Output shows UDID like: 00008110-XXXXXXXXXXXX

# 2. Build for device
xcodebuild build \
  -scheme MapHealth \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -derivedDataPath .build \
  -allowProvisioningUpdates

# 3. Install on device
xcrun devicectl device install app \
  --device 00008110-XXXXXXXXXXXX \
  .build/Build/Products/Debug-iphoneos/MapHealth.app

# 4. Launch app
xcrun devicectl device process launch \
  --device 00008110-XXXXXXXXXXXX \
  com.map.health

# 5. View logs (Xcode 16+ only)
xcrun devicectl device process launch \
  --device 00008110-XXXXXXXXXXXX \
  --console \
  com.map.health
```

### Code Signing Options

```bash
# Option 1: Automatic signing (prompts for Apple ID if needed)
xcodebuild build \
  -scheme MapHealth \
  -sdk iphoneos \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="XXXXXXXXXX"

# Option 2: Specific provisioning profile
xcodebuild build \
  -scheme MapHealth \
  -sdk iphoneos \
  CODE_SIGN_IDENTITY="Apple Development" \
  PROVISIONING_PROFILE_SPECIFIER="MapHealth Dev" \
  DEVELOPMENT_TEAM="XXXXXXXXXX"

# Option 3: Export options plist (for archives)
xcodebuild archive \
  -scheme MapHealth \
  -sdk iphoneos \
  -archivePath .build/MapHealth.xcarchive \
  -allowProvisioningUpdates

xcodebuild -exportArchive \
  -archivePath .build/MapHealth.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath .build/export
```

### ExportOptions.plist Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>XXXXXXXXXX</string>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
```

### Deploy Script

Create `ios/scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

SCHEME="MapHealth"
BUNDLE_ID="com.map.health"
BUILD_DIR=".build"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Finding connected devices...${NC}"
DEVICE=$(xcrun devicectl list devices -j 2>/dev/null | jq -r '.result.devices[0].identifier // empty')

if [ -z "$DEVICE" ]; then
    echo -e "${RED}No device found. Connect your iPhone via USB.${NC}"
    exit 1
fi

DEVICE_NAME=$(xcrun devicectl list devices -j 2>/dev/null | jq -r '.result.devices[0].deviceProperties.name // "iPhone"')
echo -e "${GREEN}Found: $DEVICE_NAME ($DEVICE)${NC}"

echo -e "${YELLOW}Building for device...${NC}"
xcodebuild build \
    -scheme $SCHEME \
    -sdk iphoneos \
    -destination "generic/platform=iOS" \
    -derivedDataPath $BUILD_DIR \
    -allowProvisioningUpdates \
    2>&1 | xcbeautify

APP_PATH="$BUILD_DIR/Build/Products/Debug-iphoneos/$SCHEME.app"

if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}Build failed - app not found at $APP_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}Installing on $DEVICE_NAME...${NC}"
xcrun devicectl device install app --device $DEVICE "$APP_PATH"

echo -e "${YELLOW}Launching...${NC}"
xcrun devicectl device process launch --device $DEVICE $BUNDLE_ID

echo -e "${GREEN}Done! App is running on $DEVICE_NAME${NC}"
```

Make it executable:
```bash
chmod +x ios/scripts/deploy.sh
```

### Alternative: ios-deploy (iOS < 17)

```bash
# Install
brew install ios-deploy

# List devices
ios-deploy -c

# Install and launch
ios-deploy --bundle .build/Build/Products/Debug-iphoneos/MapHealth.app

# Install, launch, and show logs
ios-deploy --bundle .build/Build/Products/Debug-iphoneos/MapHealth.app --debug
```

### Alternative: ideviceinstaller (Cross-platform)

```bash
# Install
brew install libimobiledevice ideviceinstaller

# List devices
idevice_id -l

# Install IPA
ideviceinstaller -i MapHealth.ipa

# Uninstall
ideviceinstaller -U com.map.health
```

### One-Time Xcode Setup

Before CLI deploys work, you need to do this **once**:

1. Open `MapHealth.xcodeproj` in Xcode
2. Sign in with Apple ID (Xcode → Settings → Accounts)
3. Select your Team in Signing & Capabilities
4. Connect iPhone, trust the computer
5. Build once to register device with Apple

After this, CLI works forever.

### Troubleshooting

| Error | Solution |
|-------|----------|
| "No device found" | Enable Developer Mode on iPhone, trust computer |
| "Device is locked" | Unlock iPhone screen |
| "Provisioning profile" | Run with `-allowProvisioningUpdates` or setup in Xcode once |
| "Code signing" | Add `DEVELOPMENT_TEAM="XXXX"` to build command |
| "iOS version mismatch" | Update Xcode or use older deployment target |

### WiFi Deployment

After initial USB pairing:

```bash
# Enable WiFi sync on device (or via Finder)
# Device will appear in devicectl list even without USB

xcrun devicectl list devices
# Shows both USB and WiFi-connected devices
```

---

## GitHub Actions CI

### Basic Workflow

```yaml
# .github/workflows/ios-tests.yml
name: iOS Tests

on:
  push:
    branches: [main]
    paths: ['ios/**']
  pull_request:
    paths: ['ios/**']

jobs:
  test:
    runs-on: macos-14
    defaults:
      run:
        working-directory: ios

    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.2.app

      - name: List Available Schemes
        run: xcodebuild -list

      - name: Run Unit Tests
        run: |
          xcodebuild test \
            -scheme MapHealth \
            -sdk iphonesimulator \
            -destination "platform=iOS Simulator,name=iPhone 15,OS=17.2" \
            -parallel-testing-enabled YES \
            CODE_SIGNING_ALLOWED=NO \
            | xcbeautify --renderer github-actions

      - name: Build for Device (No Sign)
        run: |
          xcodebuild build \
            -scheme MapHealth \
            -sdk iphoneos \
            CODE_SIGNING_ALLOWED=NO
```

### Optimizations

```yaml
# Speed up CI by skipping code signing
CODE_SIGNING_ALLOWED=NO

# Parallel testing
-parallel-testing-enabled YES

# Derived data caching
-derivedDataPath .build/DerivedData
```

---

## Swift Build: The Future (Feb 2025)

Apple announced open-sourcing Xcode's build engine as "Swift Build":

> "Contributing Xcode's build engine to the Swift project... SwiftPM now has the opportunity to offer a unified build execution engine across all platforms."

### What This Enables (Coming Soon)

| Feature | Current | With Swift Build |
|---------|---------|------------------|
| `swift build` for iOS | ❌ | ✅ |
| `swift test` for iOS | ❌ | ✅ |
| Consistent behavior Xcode ↔ CLI | ❌ | ✅ |
| Linux/Windows iOS builds | ❌ | Potentially ✅ |

### Timeline

- **February 2025**: Initial PR submitted to SwiftPM
- **Coming months**: Integration work with community
- **Future**: Unified build system across all platforms

### Source

- [Swift.org: The Next Chapter in Swift Build Technologies](https://www.swift.org/blog/the-next-chapter-in-swift-build-technologies/)

---

## Recommended Project Structure

To maximize testability and CLI usage, structure the project as a Swift Package with a thin app wrapper:

```
ios/
├── Package.swift                    # SPM manifest
├── Sources/
│   ├── MapHealthCore/               # Pure Swift library (testable!)
│   │   ├── Models/
│   │   │   ├── HealthData.swift
│   │   │   └── SleepStages.swift
│   │   ├── Services/
│   │   │   ├── MapAPIClient.swift
│   │   │   └── BackgroundSync.swift
│   │   └── HealthKit/
│   │       ├── HealthDataFetcher.swift
│   │       └── HealthDataProcessor.swift
│   │
│   └── MapHealthApp/                # Thin SwiftUI app shell
│       ├── MapHealthApp.swift
│       ├── Views/
│       └── AppDelegate.swift
│
├── Tests/
│   └── MapHealthCoreTests/          # Unit tests (swift test compatible)
│       ├── HealthDataTests.swift
│       ├── APIClientTests.swift
│       └── Mocks/
│
└── MapHealth.xcodeproj/             # Only for device builds & signing
```

### Package.swift Example

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MapHealth",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "MapHealthCore", targets: ["MapHealthCore"]),
    ],
    dependencies: [
        // Spezi packages
        .package(url: "https://github.com/StanfordSpezi/Spezi.git", from: "1.0.0"),
        .package(url: "https://github.com/StanfordSpezi/SpeziHealthKit.git", from: "0.5.0"),
    ],
    targets: [
        .target(
            name: "MapHealthCore",
            dependencies: [
                .product(name: "Spezi", package: "Spezi"),
                .product(name: "SpeziHealthKit", package: "SpeziHealthKit"),
            ]
        ),
        .testTarget(
            name: "MapHealthCoreTests",
            dependencies: ["MapHealthCore"]
        ),
    ]
)
```

### Benefits of This Structure

| Aspect | Benefit |
|--------|---------|
| **Unit tests** | Run with `swift test` (fast, no simulator) |
| **iOS tests** | Run with `xcodebuild test` |
| **CI/CD** | No Xcode IDE needed |
| **Code reuse** | Core logic usable in macOS/watchOS |
| **Future-proof** | Ready for Swift Build when it ships |

---

## Limitations & Workarounds

### HealthKit Testing

**Problem**: HealthKit requires a real device—simulator has no health data.

**Workarounds**:
1. Mock HealthKit in unit tests
2. Use dependency injection for `HKHealthStore`
3. Integration tests on physical device only

```swift
// Protocol for mocking
protocol HealthDataFetching {
    func fetchSteps() async throws -> [Double]
}

// Production implementation
class HealthDataFetcher: HealthDataFetching { ... }

// Test mock
class MockHealthDataFetcher: HealthDataFetching {
    var mockSteps: [Double] = [1000, 2000, 3000]
    func fetchSteps() async throws -> [Double] { mockSteps }
}
```

### Code Signing

**Problem**: `xcodebuild` can build unsigned, but can't install on device.

**Solutions**:
1. Use Xcode for device deployment (one-time setup)
2. Use Fastlane for automated signing
3. Use `xcrun altool` for App Store uploads

### Code Coverage

**Problem**: `xcodebuild test` with Package.swift doesn't collect coverage.

**Workaround**: Keep minimal `.xcodeproj` for coverage reports:
```bash
xcodebuild test \
  -project MapHealth.xcodeproj \
  -scheme MapHealth \
  -enableCodeCoverage YES
```

---

## CLI Cheat Sheet

```bash
# === Build & Test ===

# List schemes
xcodebuild -list

# Build for simulator
xcodebuild build -scheme MapHealth -sdk iphonesimulator -destination "platform=iOS Simulator,name=iPhone 15"

# Build for device
xcodebuild build -scheme MapHealth -sdk iphoneos -destination "generic/platform=iOS" -allowProvisioningUpdates

# Run tests
xcodebuild test -scheme MapHealth -sdk iphonesimulator -destination "platform=iOS Simulator,name=iPhone 15" CODE_SIGNING_ALLOWED=NO

# Clean build
xcodebuild clean -scheme MapHealth

# === Simulators ===

# List simulators
xcrun simctl list devices available

# Boot simulator
xcrun simctl boot "iPhone 15"

# Install app on simulator
xcrun simctl install booted ./Build/Products/Debug-iphonesimulator/MapHealth.app

# Launch app on simulator
xcrun simctl launch booted com.map.health

# === Physical Devices (iOS 17+) ===

# List connected devices
xcrun devicectl list devices

# List devices as JSON (for scripting)
xcrun devicectl list devices -j

# Install app on device
xcrun devicectl device install app --device <UDID> ./path/to/App.app

# Launch app on device
xcrun devicectl device process launch --device <UDID> com.map.health

# Launch with console output (Xcode 16+)
xcrun devicectl device process launch --device <UDID> --console com.map.health

# Kill app on device
xcrun devicectl device process terminate --device <UDID> com.map.health

# === Physical Devices (Legacy - iOS < 17) ===

# List devices
ios-deploy -c

# Install and run
ios-deploy --bundle ./path/to/App.app

# Install, run, and debug
ios-deploy --bundle ./path/to/App.app --debug

# === Package Management ===

# Resolve dependencies
xcodebuild -resolvePackageDependencies

# Update packages
swift package update

# Show dependency graph
swift package show-dependencies
```

---

## References

### Swift Package Manager
- [Swift Package Manager GitHub](https://github.com/swiftlang/swift-package-manager)
- [Testing iOS Swift Packages Without Xcode Project](https://www.jessesquires.com/blog/2021/11/03/swift-package-ios-tests/)
- [Swift Forums: SwiftPM for iOS](https://forums.swift.org/t/swiftpm-swift-build-for-ios/42517)
- [The Next Chapter in Swift Build Technologies](https://www.swift.org/blog/the-next-chapter-in-swift-build-technologies/)

### Device Deployment
- [xcrun devicectl - React Native CLI Discussion](https://github.com/react-native-community/cli/issues/2610)
- [ios-deploy GitHub](https://github.com/ios-control/ios-deploy)
- [libimobiledevice / ideviceinstaller](https://github.com/libimobiledevice/ideviceinstaller)
- [SweetPad iOS Devices Docs](https://sweetpad.hyzyla.dev/docs/devices/)
- [xcodebuild Deploy from Command Line](https://medium.com/xcblog/xcodebuild-deploy-ios-app-from-command-line-c6defff0d8b8)

### CI/CD
- [GitHub Actions for Xcode](https://qualitycoding.org/github-actions-ci-xcode/)
- [swift-build GitHub Action](https://github.com/marketplace/actions/swift-build-and-test)
- [Running iOS UI Tests in GitHub Actions](https://www.technoblather.ca/running-ios-ui-tests-in-github-actions/)
