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

# Launch app
xcrun simctl launch booted com.map.health

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

- [Swift Package Manager GitHub](https://github.com/swiftlang/swift-package-manager)
- [Testing iOS Swift Packages Without Xcode Project](https://www.jessesquires.com/blog/2021/11/03/swift-package-ios-tests/)
- [Swift Forums: SwiftPM for iOS](https://forums.swift.org/t/swiftpm-swift-build-for-ios/42517)
- [The Next Chapter in Swift Build Technologies](https://www.swift.org/blog/the-next-chapter-in-swift-build-technologies/)
- [GitHub Actions for Xcode](https://qualitycoding.org/github-actions-ci-xcode/)
- [swift-build GitHub Action](https://github.com/marketplace/actions/swift-build-and-test)
