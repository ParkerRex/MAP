# CLI Development

You can build/test without the Xcode UI. You still need Xcode Command Line Tools.

## Prereqs (do this once)

```bash
xcode-select --install
xcodebuild -version
```

If you need code signing, open Xcode once and set your Team in Signing & Capabilities.

## Find schemes (do not guess)

```bash
cd ios
xcodebuild -list -project MapHealth.xcodeproj
```

Use the scheme names that actually show up on your machine.

## Build

### Simulator

```bash
xcodebuild build \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 16,OS=18.6"
```

Use whatever simulator exists on your machine:
`xcrun simctl list devices available`.

### Device (unsigned)

```bash
xcodebuild build \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphoneos \
  CODE_SIGNING_ALLOWED=NO
```

### Device (signed)

```bash
xcodebuild build \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="YOUR_TEAM_ID"
```

## Tests

### Swift package unit tests (MapHealthCore)

```bash
swift test
```

### Xcode tests

```bash
xcodebuild test \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 16,OS=18.6" \
  CODE_SIGNING_ALLOWED=NO
```

### Pretty output

```bash
brew install xcbeautify
xcodebuild test \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 16,OS=18.6" \
  CODE_SIGNING_ALLOWED=NO \
  | xcbeautify
```

## Simulator install/launch

Bundle ID in the project is `com.parkerrex.maphealth` (change if you rename it).

```bash
xcrun simctl install booted \
  ./Build/Products/Debug-iphonesimulator/MapHealth.app

xcrun simctl launch booted com.parkerrex.maphealth
```

## Signing environment variables

| Variable | Meaning |
|---------|---------|
| `CODE_SIGNING_ALLOWED=NO` | Skip signing |
| `DEVELOPMENT_TEAM` | Apple Developer Team ID |
| `CODE_SIGN_IDENTITY` | Signing cert name |
| `PROVISIONING_PROFILE_SPECIFIER` | Profile name |

## Common failures

- **"No scheme named X"**: Share the scheme in Xcode or use a scheme that actually exists.
- **Provisioning profile errors**: run once with `-allowProvisioningUpdates`.
- **Simulator not found**: list devices and pick one: `xcrun simctl list devices available`.
- **SwiftLint build tool failures**: lint runs during build; fix the violation or the build fails.
- **Stale build output**: `xcodebuild clean -scheme <APP_SCHEME>` then rebuild.
