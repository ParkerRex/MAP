# Map iOS App Specification

> **Status**: Draft
> **Last Updated**: 2024-12-31
> **Reference Project**: [Stanford HealthGPT](https://github.com/StanfordBDHG/HealthGPT)

---

## Executive Summary

Build a native iOS app that pulls health data from Apple Health (HealthKit) and syncs it to the Map backend. This enables data from **8 Sleep**, **Apple Watch**, **Oura**, **Garmin**, and any other device that writes to Apple Health to flow into Map.

The app is based on Stanford's open-source **HealthGPT** project, which provides a production-ready foundation with HealthKit integration, LLM chat, and modern Swift architecture.

---

## Why Native iOS App?

**Apple Health has no web API.** All data stays on-device. The only way to access it is:

1. Native iOS app using HealthKit framework
2. User must explicitly grant permission per data type
3. App can then sync data to your backend

Third-party wrapper services (Terra, Vital, etc.) just embed an SDK in YOUR app anyway - they don't have magic access. Going direct is cleaner and free.

---

## Reference: HealthGPT Analysis

### What HealthGPT Provides

| Feature | Description | Implementation | Reusable? |
|---------|-------------|----------------|-----------|
| **HealthKit Integration** | Pulls 6 data types from Apple Health | `SpeziHealthKit` + custom `HealthDataFetcher` | Yes |
| **LLM Chat Interface** | Chat UI with streaming responses | `SpeziChat` + `SpeziLLM` | Yes |
| **OpenAI Integration** | GPT-3.5/GPT-4/GPT-4o support | `SpeziLLMOpenAI` | Yes (swap for Claude) |
| **Local LLM** | On-device Llama 3.2 3B inference | `SpeziLLMLocal` | Optional |
| **Fog LLM** | Local network inference via mDNS | `SpeziLLMFog` | Optional |
| **Text-to-Speech** | Read responses aloud | `SpeziSpeechSynthesizer` | Yes |
| **Speech-to-Text** | Voice input | `SpeziChat` built-in | Yes |
| **Chat Export** | Export conversation as text | `SpeziChat` built-in | Yes |
| **Onboarding Flow** | Multi-step setup wizard | `SpeziOnboarding` + `SpeziViews` | Yes |
| **Keychain Storage** | Secure API key storage | `SpeziKeychainStorage` | Yes |
| **Background Delivery** | HealthKit background updates | Entitlements enabled | Yes |

### Current HealthGPT Data Types

| Data Type | HK Identifier | Unit | Query Method |
|-----------|---------------|------|--------------|
| Steps | `.stepCount` | count | cumulative sum |
| Active Energy | `.activeEnergyBurned` | kcal | cumulative sum |
| Exercise Time | `.appleExerciseTime` | minutes | cumulative sum |
| Body Weight | `.bodyMass` | lbs | discrete avg |
| Resting HR | `.restingHeartRate` | bpm | discrete avg |
| Sleep | `.sleepAnalysis` (category) | hours | sample query |

### Stanford Spezi Dependencies

```
Spezi (Core)           - Modular app architecture
SpeziHealthKit         - HealthKit abstraction layer
SpeziLLM               - LLM orchestration (multi-backend)
SpeziLLMOpenAI         - OpenAI/GPT integration
SpeziLLMLocal          - On-device Llama inference
SpeziLLMFog            - Local network LLM (fog computing)
SpeziChat              - Chat UI with speech support
SpeziSpeechSynthesizer - Text-to-speech
SpeziOnboarding        - Multi-step onboarding flows
SpeziViews             - Common UI components
SpeziStorage           - Local storage abstractions
SpeziKeychainStorage   - Secure credential storage
```

---

## HealthKit Data Types to Implement

### Sleep & Recovery (Priority 1 - 8 Sleep Data)

| Data Type | HK Identifier | What It Provides | 8 Sleep? |
|-----------|---------------|------------------|----------|
| Sleep Analysis | `.sleepAnalysis` | Time asleep, stages | Yes |
| Sleep Stages | `HKCategoryValueSleepAnalysis` | Core/Deep/REM/Awake | Yes |
| HRV (SDNN) | `.heartRateVariabilitySDNN` | Heart rate variability ms | Yes |
| Heart Rate | `.heartRate` | Per-sample HR | Yes |
| Resting HR | `.restingHeartRate` | Daily resting HR | Yes |
| Respiratory Rate | `.respiratoryRate` | Breaths/min | Yes |
| Blood Oxygen | `.oxygenSaturation` | SpO2 % | Partial |
| Skin Temperature | `.appleSleepingWristTemperature` | Deviation °C | No (Apple Watch only) |

### Activity & Fitness (Priority 2)

| Data Type | HK Identifier | What It Provides |
|-----------|---------------|------------------|
| Steps | `.stepCount` | Daily step count |
| Active Energy | `.activeEnergyBurned` | Calories burned |
| Basal Energy | `.basalEnergyBurned` | Resting metabolism |
| Exercise Time | `.appleExerciseTime` | Workout minutes |
| Stand Time | `.appleStandTime` | Standing minutes |
| Move Time | `.appleMoveTime` | Active minutes |
| Distance Walking | `.distanceWalkingRunning` | Walk/run distance |
| Distance Cycling | `.distanceCycling` | Bike distance |
| Distance Swimming | `.distanceSwimming` | Swim distance |
| Flights Climbed | `.flightsClimbed` | Floors climbed |
| VO2 Max | `.vo2Max` | Cardio fitness |
| Walking HR Avg | `.walkingHeartRateAverage` | HR while walking |

### Body Measurements (Priority 3)

| Data Type | HK Identifier | What It Provides |
|-----------|---------------|------------------|
| Body Mass | `.bodyMass` | Weight |
| Body Fat % | `.bodyFatPercentage` | Fat percentage |
| Lean Body Mass | `.leanBodyMass` | Muscle mass |
| BMI | `.bodyMassIndex` | Body mass index |
| Height | `.height` | Height |
| Waist Circumference | `.waistCircumference` | Waist size |

### Nutrition (Priority 4 - If User Logs Food)

| Data Type | HK Identifier | What It Provides |
|-----------|---------------|------------------|
| Dietary Energy | `.dietaryEnergyConsumed` | Calories in |
| Protein | `.dietaryProtein` | Grams protein |
| Carbohydrates | `.dietaryCarbohydrates` | Grams carbs |
| Fat | `.dietaryFatTotal` | Grams fat |
| Water | `.dietaryWater` | mL water |
| Caffeine | `.dietaryCaffeine` | mg caffeine |

### Mental Health (Priority 5 - iOS 17+)

| Data Type | HK Identifier | What It Provides |
|-----------|---------------|------------------|
| State of Mind | `HKStateOfMind` | Logged emotions/moods |
| Mindful Minutes | `.mindfulSession` | Meditation time |

---

## What 8 Sleep Writes to Apple Health

8 Sleep Pod syncs these metrics to HealthKit:

| Metric | HealthKit Type | Available in HK? |
|--------|----------------|------------------|
| Sleep Duration | `.sleepAnalysis` | Yes |
| Sleep Stages | `HKCategoryValueSleepAnalysis` | Yes |
| Heart Rate (overnight) | `.heartRate` | Yes |
| HRV | `.heartRateVariabilitySDNN` | Yes |
| Respiratory Rate | `.respiratoryRate` | Yes |
| Bed Temperature | N/A | No (8 Sleep app only) |
| Room Temperature | N/A | No (8 Sleep app only) |
| Room Humidity | N/A | No (8 Sleep app only) |

**Key Insight**: All the important 8 Sleep data IS available via HealthKit. Only the environmental metrics (temp/humidity) are locked to 8 Sleep's app.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Map iOS App                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   SwiftUI    │    │  Onboarding  │    │   Settings   │      │
│  │    Views     │    │     Flow     │    │     View     │      │
│  └──────┬───────┘    └──────────────┘    └──────────────┘      │
│         │                                                       │
│  ┌──────▼───────────────────────────────────────────────┐      │
│  │                  Spezi Modules                        │      │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │      │
│  │  │HealthData   │  │HealthData   │  │   LLM       │   │      │
│  │  │  Fetcher    │  │ Interpreter │  │  Runner     │   │      │
│  │  └──────┬──────┘  └─────────────┘  └──────┬──────┘   │      │
│  └─────────┼─────────────────────────────────┼──────────┘      │
│            │                                 │                  │
│  ┌─────────▼─────────┐         ┌─────────────▼──────────┐      │
│  │    HealthKit      │         │     Anthropic API      │      │
│  │   (Apple Health)  │         │       (Claude)         │      │
│  └───────────────────┘         └────────────────────────┘      │
│            │                                                    │
│  ┌─────────▼─────────────────────────────────────────────┐     │
│  │                   Map Backend Sync                     │     │
│  │  - POST /api/health/apple-health/sync                 │     │
│  │  - Authenticated with Map session                      │     │
│  │  - Background sync every 15 min                        │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Core Health Sync

**Goal**: Pull health data from Apple Health and sync to Map backend.

| Task | Description | Effort |
|------|-------------|--------|
| Fork HealthGPT | Clone and rename to MapHealth | 1 hr |
| Expand HealthDataFetcher | Add all 30+ data types | 4 hrs |
| Create HealthData model | Comprehensive data struct | 2 hrs |
| Add Map authentication | Sign in with Map account | 4 hrs |
| Build backend sync | POST data to Map API | 4 hrs |
| Background sync | HealthKit background delivery | 4 hrs |
| Onboarding flow | Permissions + Map login | 2 hrs |

**Deliverable**: App that syncs all Apple Health data to Map backend.

### Phase 2: AI Chat

**Goal**: Claude-powered health chat (like HealthGPT with GPT).

| Task | Description | Effort |
|------|-------------|--------|
| Swap OpenAI → Claude | Use Anthropic SDK | 2 hrs |
| Update prompt generator | Include all health metrics | 2 hrs |
| Add chat persistence | Save conversations | 2 hrs |

**Deliverable**: Chat with Claude about your health data.

### Phase 3: Health Dashboard

**Goal**: Mirror web app's health page in iOS.

| Task | Description | Effort |
|------|-------------|--------|
| Dashboard view | Today's metrics grid | 4 hrs |
| Sleep details view | Sleep stages, duration | 2 hrs |
| Activity view | Steps, workouts, energy | 2 hrs |
| Trends view | 7-day / 30-day charts | 4 hrs |

**Deliverable**: Full health dashboard in iOS app.

### Phase 4: Polish

| Task | Description | Effort |
|------|-------------|--------|
| Push notifications | Recovery alerts, reminders | 4 hrs |
| iOS Widgets | Home screen widgets | 4 hrs |
| Apple Watch | Complications, glances | 8 hrs |
| Offline support | Local caching | 4 hrs |

---

## Backend API Requirements

New endpoints needed in Map backend:

### POST /api/health/apple-health/sync

Receives health data from iOS app.

```typescript
interface AppleHealthSyncPayload {
  syncedAt: string; // ISO timestamp
  deviceId: string; // Unique device identifier

  // Sleep data
  sleep?: {
    date: string;
    totalSleepMs: number;
    inBedMs: number;
    awakeMs: number;
    remMs: number;
    coreMs: number;
    deepMs: number;
    sleepEfficiency: number;
  }[];

  // Heart data
  heart?: {
    date: string;
    restingHr: number;
    hrvSdnn: number;
    walkingHrAvg?: number;
    vo2Max?: number;
  }[];

  // Activity data
  activity?: {
    date: string;
    steps: number;
    activeEnergy: number;
    basalEnergy: number;
    exerciseMinutes: number;
    standMinutes: number;
    distance: number;
    flightsClimbed: number;
  }[];

  // Body measurements
  body?: {
    date: string;
    weight?: number;
    bodyFat?: number;
    leanMass?: number;
  }[];

  // Raw samples (optional, for detailed analysis)
  samples?: {
    type: string;
    value: number;
    unit: string;
    startDate: string;
    endDate: string;
    sourceName: string;
  }[];
}
```

### GET /api/health/apple-health/status

Check if iOS app is connected.

```typescript
interface AppleHealthStatus {
  connected: boolean;
  lastSyncAt: string | null;
  deviceName: string | null;
  dataTypes: string[]; // Which types are syncing
}
```

---

## Database Schema Additions

```sql
-- Apple Health sync metadata
CREATE TABLE apple_health_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id TEXT NOT NULL,
  device_name TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Apple Health samples (normalized)
CREATE TABLE apple_health_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id UUID REFERENCES apple_health_devices(id),
  sample_type TEXT NOT NULL, -- e.g., 'stepCount', 'heartRate'
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  source_name TEXT, -- e.g., 'Apple Watch', '8 Sleep'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ah_samples_user_type_date
  ON apple_health_samples(user_id, sample_type, start_date);
```

---

## Key Files to Create/Modify

### From HealthGPT (modify)

| File | Changes Needed |
|------|----------------|
| `HealthGPTAppDelegate.swift` | Add all HealthKit data types to permissions |
| `HealthDataFetcher.swift` | Add 25+ new fetch methods |
| `HealthDataFetcher+Process.swift` | Process all new data types |
| `HealthData.swift` | Expand struct with all metrics |
| `PromptGenerator.swift` | Include all metrics in LLM prompt |

### New Files

| File | Purpose |
|------|---------|
| `MapAuthentication.swift` | Sign in with Map account |
| `MapAPIClient.swift` | HTTP client for Map backend |
| `BackgroundSync.swift` | HealthKit background delivery handler |
| `HealthDashboardView.swift` | Main dashboard UI |
| `SleepDetailView.swift` | Sleep breakdown UI |
| `ActivityDetailView.swift` | Activity breakdown UI |

---

## Entitlements Required

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <!-- HealthKit access -->
  <key>com.apple.developer.healthkit</key>
  <true/>
  <key>com.apple.developer.healthkit.access</key>
  <array/>
  <key>com.apple.developer.healthkit.background-delivery</key>
  <true/>

  <!-- For on-device LLM (optional) -->
  <key>com.apple.developer.kernel.increased-memory-limit</key>
  <true/>

  <!-- Background refresh -->
  <key>com.apple.developer.background-modes</key>
  <array>
    <string>fetch</string>
    <string>processing</string>
  </array>
</dict>
</plist>
```

---

## Info.plist Keys Required

```xml
<!-- HealthKit usage descriptions -->
<key>NSHealthShareUsageDescription</key>
<string>Map uses your health data to provide personalized insights and track your wellness over time.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>Map can log workouts and health metrics on your behalf.</string>

<!-- Background refresh -->
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
  <string>com.map.health.sync</string>
</array>
```

---

## Swift Code: Expanded HealthDataFetcher

```swift
import HealthKit
import Spezi

@Observable
class HealthDataFetcher: DefaultInitializable, Module, EnvironmentAccessible {
    @ObservationIgnored private let healthStore = HKHealthStore()

    // All quantity types to read
    static let quantityTypes: Set<HKQuantityType> = [
        // Activity
        HKQuantityType(.stepCount),
        HKQuantityType(.distanceWalkingRunning),
        HKQuantityType(.distanceCycling),
        HKQuantityType(.flightsClimbed),
        HKQuantityType(.activeEnergyBurned),
        HKQuantityType(.basalEnergyBurned),
        HKQuantityType(.appleExerciseTime),
        HKQuantityType(.appleStandTime),

        // Heart & Recovery
        HKQuantityType(.heartRate),
        HKQuantityType(.restingHeartRate),
        HKQuantityType(.walkingHeartRateAverage),
        HKQuantityType(.heartRateVariabilitySDNN),
        HKQuantityType(.vo2Max),
        HKQuantityType(.oxygenSaturation),

        // Body
        HKQuantityType(.bodyMass),
        HKQuantityType(.bodyFatPercentage),
        HKQuantityType(.leanBodyMass),
        HKQuantityType(.bodyMassIndex),
        HKQuantityType(.height),

        // Sleep-related
        HKQuantityType(.respiratoryRate),

        // Nutrition
        HKQuantityType(.dietaryEnergyConsumed),
        HKQuantityType(.dietaryProtein),
        HKQuantityType(.dietaryCarbohydrates),
        HKQuantityType(.dietaryFatTotal),
        HKQuantityType(.dietaryWater),
        HKQuantityType(.dietaryCaffeine),
    ]

    // Category types to read
    static let categoryTypes: Set<HKCategoryType> = [
        HKCategoryType(.sleepAnalysis),
        HKCategoryType(.mindfulSession),
    ]

    required init() { }

    // MARK: - Sleep Data

    func fetchSleepAnalysis(for dateRange: DateInterval) async throws -> [SleepSession] {
        let sleepType = HKCategoryType(.sleepAnalysis)
        let predicate = HKQuery.predicateForSamples(
            withStart: dateRange.start,
            end: dateRange.end,
            options: .strictEndDate
        )

        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate, order: .reverse)]
        )

        let results = try await descriptor.result(for: healthStore)

        // Group by night and calculate stages
        return processSleepSamples(results)
    }

    // MARK: - HRV Data

    func fetchHRV(for dateRange: DateInterval) async throws -> [HRVSample] {
        try await fetchQuantitySamples(
            for: .heartRateVariabilitySDNN,
            unit: .secondUnit(with: .milli),
            dateRange: dateRange
        ).map { HRVSample(date: $0.date, sdnn: $0.value) }
    }

    // MARK: - Heart Rate

    func fetchHeartRateSamples(for dateRange: DateInterval) async throws -> [HeartRateSample] {
        try await fetchQuantitySamples(
            for: .heartRate,
            unit: .count().unitDivided(by: .minute()),
            dateRange: dateRange
        ).map { HeartRateSample(date: $0.date, bpm: $0.value) }
    }

    // ... (additional fetch methods for each data type)
}
```

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Core Sync | 1-2 weeks | Backend API endpoints |
| Phase 2: AI Chat | 3-5 days | Anthropic API key |
| Phase 3: Dashboard | 1 week | Design mockups |
| Phase 4: Polish | 1-2 weeks | TestFlight feedback |

**Total**: 4-6 weeks to production-ready app.

---

## Open Questions

1. **App Store vs TestFlight only?** - App Store requires Apple review, health apps get extra scrutiny
2. **Sync frequency?** - Every 15 min? Hourly? On-demand only?
3. **Data retention?** - How much history to sync? 30 days? All time?
4. **Offline-first?** - Cache data locally when offline?
5. **Apple Watch app?** - Standalone or just iPhone?
6. **Sign in with Apple?** - In addition to Map account login?

---

## Resources

- [Stanford HealthGPT GitHub](https://github.com/StanfordBDHG/HealthGPT)
- [Stanford Spezi Framework](https://github.com/StanfordSpezi/Spezi)
- [SpeziHealthKit Docs](https://swiftpackageindex.com/StanfordSpezi/SpeziHealthKit)
- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [HKQuantityTypeIdentifier Reference](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier)
- [HealthKit Data Types](https://developer.apple.com/documentation/healthkit/data-types)
