# HealthKit Integration

This app pulls the last 14 days of Apple Health data, uses it for chat context, and syncs it to the Map backend.

## What we collect

### Activity

| Metric | HealthKit Type | Unit |
|--------|---------------|------|
| Steps | `stepCount` | count |
| Distance | `distanceWalkingRunning` | miles |
| Active Energy | `activeEnergyBurned` | kcal |
| Basal Energy | `basalEnergyBurned` | kcal |
| Exercise Time | `appleExerciseTime` | minutes |
| Stand Time | `appleStandTime` | minutes |
| Flights Climbed | `flightsClimbed` | count |

### Heart & Recovery

| Metric | HealthKit Type | Unit |
|--------|---------------|------|
| Resting Heart Rate | `restingHeartRate` | bpm |
| Walking Heart Rate | `walkingHeartRateAverage` | bpm |
| HRV | `heartRateVariabilitySDNN` | ms |
| VO2 Max | `vo2Max` | mL/kg/min |
| SpO2 | `oxygenSaturation` | % |
| Respiratory Rate | `respiratoryRate` | breaths/min |

### Sleep

| Metric | HealthKit Type | Unit |
|--------|---------------|------|
| Total Sleep | `sleepAnalysis` | hours |
| Awake | `asleepAwake` | hours |
| REM | `asleepREM` | hours |
| Core | `asleepCore` | hours |
| Deep | `asleepDeep` | hours |
| In Bed | `inBed` | hours |

### Body

| Metric | HealthKit Type | Unit |
|--------|---------------|------|
| Weight | `bodyMass` | lbs |
| Body Fat % | `bodyFatPercentage` | % |
| Lean Body Mass | `leanBodyMass` | lbs |

## Where it goes

### Local (chat)

`HealthDataFetcher` builds the last 14 days of data and `PromptGenerator` turns it into the OpenAI system prompt.

### Remote (Map backend)

Health data is synced via:

- `POST /api/health/apple-health/sync`
- `GET /api/health/apple-health/status`

Payload shape (from `HealthSyncPayload`):

```swift
public struct HealthSyncPayload: Codable {
    public var syncedAt: String
    public var deviceId: String
    public var healthData: [HealthData]
}
```

`deviceId` is a persistent UUID stored in `UserDefaults` under `map.deviceId`.

## Permissions

`HealthKitAuthorizationManager` requests permissions during onboarding. If HealthKit is not available, onboarding skips the HealthKit screen.

## Background sync

`BackgroundSyncManager` enables background delivery and triggers a sync when HealthKit updates arrive.

## Testing (blunt version)

- Simulator = no real HealthKit data.
- If you need real data, use a physical iPhone.
- Use `--mockMode` to avoid hitting OpenAI during UI tests.

## Entitlements

Current entitlements are minimal:

- `com.apple.developer.healthkit` = true
- `com.apple.developer.healthkit.background-delivery` = true

If you need Health Records access, add `com.apple.developer.healthkit.access` and the specific types. It is not in the repo today.

## Info.plist

HealthKit requires these usage strings in `ios/MapHealth/Supporting Files/Info.plist`:

- `NSHealthShareUsageDescription`
- `NSHealthUpdateUsageDescription`
