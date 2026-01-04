# Device Deployment

You need a physical iPhone. HealthKit and background delivery are meaningless in the simulator.

## Requirements

| Requirement | Notes |
|-------------|-------|
| Xcode CLI tools | `xcode-select --install` |
| Apple Developer account | Free works for dev |
| Device registered | One-time Xcode setup |
| Developer Mode on iPhone | Settings → Privacy & Security → Developer Mode |
| USB or paired WiFi | First pairing must be USB |

## One-time Xcode setup

1. Open `MapHealth.xcodeproj` in Xcode.
2. Sign in with Apple ID.
3. Pick your Team in Signing & Capabilities.
4. Build once to register the device.

## Quick deploy script

```bash
cd ios
./scripts/deploy.sh
```

## Manual deploy

### 1) List devices

```bash
xcrun devicectl list devices
```

### 2) Build

```bash
xcodebuild build \
  -project MapHealth.xcodeproj \
  -scheme <APP_SCHEME> \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -derivedDataPath .build \
  -allowProvisioningUpdates
```

### 3) Install

```bash
xcrun devicectl device install app \
  --device <UDID> \
  .build/Build/Products/Debug-iphoneos/MapHealth.app
```

### 4) Launch

Bundle ID in the project is `com.parkerrex.maphealth` (update if you change it).

```bash
xcrun devicectl device process launch \
  --device <UDID> \
  com.parkerrex.maphealth
```

### 5) Console logs (Xcode 16+)

```bash
xcrun devicectl device process launch \
  --device <UDID> \
  --console \
  com.parkerrex.maphealth
```

## WiFi deployment

After initial USB pairing, enable "Connect via network" in Xcode (Devices & Simulators). The device will show up in `devicectl list` without USB.

## Legacy tools (iOS < 17)

```bash
brew install ios-deploy

ios-deploy -c
ios-deploy --bundle .build/Build/Products/Debug-iphoneos/MapHealth.app
```
