# Device Deployment

Deploy Map Health to a physical iPhone from the command line.

## Why Physical Device?

HealthKit requires a real device for meaningful testing:
- Simulator has no health data
- Background delivery only works on device
- Real-world sync testing

## Requirements

| Requirement | How to Get |
|-------------|------------|
| Xcode CLI tools | `xcode-select --install` |
| Apple Developer account | developer.apple.com (free works for dev) |
| Device registered | One-time Xcode setup |
| Developer Mode on iPhone | Settings → Privacy & Security → Developer Mode |
| Device connected via USB | Or WiFi after initial pairing |

## One-Time Xcode Setup

Before CLI deployment works, you need to do this **once**:

1. Open `MapHealth.xcodeproj` in Xcode
2. Sign in with Apple ID (Xcode → Settings → Accounts)
3. Select your Team in Signing & Capabilities
4. Connect iPhone via USB, trust the computer
5. Build once to register device with Apple

After this, CLI deployment works indefinitely.

## Quick Deploy Script

Use the provided deploy script:

```bash
cd ios
./scripts/deploy.sh
```

This script:
1. Finds connected devices
2. Builds for device
3. Installs the app
4. Launches the app

## Manual Deployment

### 1. List Connected Devices

```bash
xcrun devicectl list devices
```

Output shows UDID like: `00008110-XXXXXXXXXXXX`

### 2. Build for Device

```bash
xcodebuild build \
  -scheme MapHealth \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -derivedDataPath .build \
  -allowProvisioningUpdates
```

### 3. Install on Device

```bash
xcrun devicectl device install app \
  --device 00008110-XXXXXXXXXXXX \
  .build/Build/Products/Debug-iphoneos/MapHealth.app
```

### 4. Launch App

```bash
xcrun devicectl device process launch \
  --device 00008110-XXXXXXXXXXXX \
  com.map.health
```

### 5. View Console Logs (Xcode 16+)

```bash
xcrun devicectl device process launch \
  --device 00008110-XXXXXXXXXXXX \
  --console \
  com.map.health
```

## Device Control Commands (iOS 17+)

### List Devices (JSON)

```bash
xcrun devicectl list devices -j
```

### Kill App on Device

```bash
xcrun devicectl device process terminate \
  --device <UDID> \
  com.map.health
```

### Get Device Info

```bash
xcrun devicectl list devices -j | jq '.result.devices[0]'
```

## Legacy Tools (iOS < 17)

### ios-deploy

```bash
# Install
brew install ios-deploy

# List devices
ios-deploy -c

# Install and launch
ios-deploy --bundle .build/Build/Products/Debug-iphoneos/MapHealth.app

# Install, launch, and debug
ios-deploy --bundle .build/Build/Products/Debug-iphoneos/MapHealth.app --debug
```

### ideviceinstaller

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

## WiFi Deployment

After initial USB pairing:

1. Enable "Connect via network" in Xcode (Window → Devices and Simulators)
2. Device appears in `devicectl list` without USB

```bash
xcrun devicectl list devices
# Shows both USB and WiFi-connected devices
```

## Code Signing Options

### Option 1: Automatic Signing

```bash
xcodebuild build \
  -scheme MapHealth \
  -sdk iphoneos \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="XXXXXXXXXX"
```

### Option 2: Specific Profile

```bash
xcodebuild build \
  -scheme MapHealth \
  -sdk iphoneos \
  CODE_SIGN_IDENTITY="Apple Development" \
  PROVISIONING_PROFILE_SPECIFIER="MapHealth Dev" \
  DEVELOPMENT_TEAM="XXXXXXXXXX"
```

### Option 3: Archive + Export

```bash
# Archive
xcodebuild archive \
  -scheme MapHealth \
  -sdk iphoneos \
  -archivePath .build/MapHealth.xcarchive \
  -allowProvisioningUpdates

# Export
xcodebuild -exportArchive \
  -archivePath .build/MapHealth.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath .build/export
```

#### ExportOptions.plist

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

## Troubleshooting

| Error | Solution |
|-------|----------|
| "No device found" | Enable Developer Mode on iPhone, trust computer |
| "Device is locked" | Unlock iPhone screen |
| "Provisioning profile" | Run with `-allowProvisioningUpdates` or setup in Xcode once |
| "Code signing" | Add `DEVELOPMENT_TEAM="XXXX"` to build command |
| "iOS version mismatch" | Update Xcode or use older deployment target |
| "Unable to install" | Check device has enough storage, delete old app |

## Deploy Script Source

The `ios/scripts/deploy.sh` script:

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
    -allowProvisioningUpdates

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
