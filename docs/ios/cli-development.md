# CLI Development

Build and test the iOS app without opening Xcode IDE.

## Prerequisites

- **Xcode Command Line Tools** - Required (contains `xcodebuild`, SDKs, simulators)
- **Xcode IDE** - Not required for build/test, only for code signing setup

```bash
# Install command line tools
xcode-select --install

# Verify installation
xcodebuild -version
```

## Package Commands

### Describe Package

```bash
cd ios
swift package describe
```

### Resolve Dependencies

```bash
xcodebuild -resolvePackageDependencies
```

### Show Dependency Tree

```bash
swift package show-dependencies
```

### Update Dependencies

```bash
swift package update
```

## Build Commands

### List Available Schemes

```bash
xcodebuild -list
```

### Build for Simulator

```bash
xcodebuild build \
  -scheme MapHealth \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15"
```

### Build for Device (Unsigned)

```bash
xcodebuild build \
  -scheme MapHealth \
  -sdk iphoneos \
  CODE_SIGNING_ALLOWED=NO
```

### Build for Device (Signed)

```bash
xcodebuild build \
  -scheme MapHealth \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="YOUR_TEAM_ID"
```

### Clean Build

```bash
xcodebuild clean -scheme MapHealth
```

## Test Commands

### Run Unit Tests

```bash
xcodebuild test \
  -scheme MapHealthCore \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15,OS=17.0" \
  CODE_SIGNING_ALLOWED=NO
```

### Run with Pretty Output

```bash
# Install xcbeautify
brew install xcbeautify

# Run tests with formatted output
xcodebuild test \
  -scheme MapHealthCore \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  CODE_SIGNING_ALLOWED=NO \
  | xcbeautify
```

### Parallel Testing

```bash
xcodebuild test \
  -scheme MapHealthCore \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  -parallel-testing-enabled YES \
  CODE_SIGNING_ALLOWED=NO
```

## Simulator Commands

### List Available Simulators

```bash
xcrun simctl list devices available
```

### Boot Simulator

```bash
xcrun simctl boot "iPhone 15"
```

### Install App on Simulator

```bash
xcrun simctl install booted ./Build/Products/Debug-iphonesimulator/MapHealth.app
```

### Launch App on Simulator

```bash
xcrun simctl launch booted com.map.health
```

### Open Simulator App

```bash
open -a Simulator
```

## Code Signing

### Without Signing (CI/Testing)

```bash
CODE_SIGNING_ALLOWED=NO
```

### Automatic Signing

```bash
-allowProvisioningUpdates \
DEVELOPMENT_TEAM="YOUR_TEAM_ID"
```

### Manual Signing

```bash
CODE_SIGN_IDENTITY="Apple Development" \
PROVISIONING_PROFILE_SPECIFIER="MapHealth Dev" \
DEVELOPMENT_TEAM="YOUR_TEAM_ID"
```

## Derived Data

### Custom Location

```bash
xcodebuild build \
  -scheme MapHealth \
  -derivedDataPath .build/DerivedData
```

### Clean Derived Data

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
# or
rm -rf .build/DerivedData
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CODE_SIGNING_ALLOWED=NO` | Skip code signing |
| `DEVELOPMENT_TEAM` | Apple Developer Team ID |
| `CODE_SIGN_IDENTITY` | Signing certificate name |
| `PROVISIONING_PROFILE_SPECIFIER` | Provisioning profile name |

## Common Issues

### "No scheme named X"

The scheme may not be shared. Check:
```bash
ls ios/MapHealth.xcodeproj/xcshareddata/xcschemes/
```

### "Provisioning profile" errors

Run with `-allowProvisioningUpdates` or set up signing in Xcode once.

### Simulator not found

List available simulators:
```bash
xcrun simctl list devices available
```

### Build cache issues

Clean and rebuild:
```bash
xcodebuild clean -scheme MapHealth
rm -rf .build
xcodebuild build -scheme MapHealth ...
```
