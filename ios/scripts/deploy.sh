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

# Try with xcbeautify if available, otherwise raw output
if command -v xcbeautify &> /dev/null; then
    xcodebuild build \
        -scheme $SCHEME \
        -sdk iphoneos \
        -destination "generic/platform=iOS" \
        -derivedDataPath $BUILD_DIR \
        -allowProvisioningUpdates \
        2>&1 | xcbeautify
else
    xcodebuild build \
        -scheme $SCHEME \
        -sdk iphoneos \
        -destination "generic/platform=iOS" \
        -derivedDataPath $BUILD_DIR \
        -allowProvisioningUpdates
fi

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
