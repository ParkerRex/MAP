# HealthKit Integration

How Map Health fetches and processes Apple Health data.

## Overview

The app uses native HealthKit APIs directly, with custom fetching logic in `HealthDataFetcher`.

## Data Types Collected

### Activity Metrics

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

### Body Measurements

| Metric | HealthKit Type | Unit |
|--------|---------------|------|
| Weight | `bodyMass` | lbs |
| Body Fat % | `bodyFatPercentage` | % |
| Lean Body Mass | `leanBodyMass` | lbs |

## Permissions Setup

Permissions are requested via `HealthKitAuthorizationManager` during onboarding.

## HealthDataFetcher

The main class for fetching health data:

```swift
public final class HealthDataFetcher {
    private let healthStore = HKHealthStore()

    // Generic fetcher for quantity data
    public func fetchLastTwoWeeksQuantityData(
        for identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        options: HKStatisticsOptions
    ) async throws -> [Double]

    // Specific metric fetchers
    public func fetchLastTwoWeeksStepCount() async throws -> [Double]
    public func fetchLastTwoWeeksActiveEnergy() async throws -> [Double]
    public func fetchLastTwoWeeksSleep() async throws -> [Double]
    public func fetchLastTwoWeeksSleepStages() async throws -> [[String: Double]]

    // Combined fetch
    public func fetchAndProcessHealthData() async -> [HealthData]
}
```

## Data Model

```swift
public struct HealthData: Codable {
    public var date: String

    // Activity
    public var steps: Double?
    public var activeEnergy: Double?
    public var basalEnergy: Double?
    public var exerciseMinutes: Double?
    public var standMinutes: Double?
    public var distanceMiles: Double?
    public var flightsClimbed: Double?

    // Heart & Recovery
    public var restingHeartRate: Double?
    public var hrvSDNN: Double?
    public var walkingHeartRate: Double?
    public var vo2Max: Double?
    public var oxygenSaturation: Double?
    public var respiratoryRate: Double?

    // Body
    public var bodyWeight: Double?
    public var bodyFatPercentage: Double?
    public var leanBodyMass: Double?

    // Sleep
    public var sleepHours: Double?
    public var sleepStages: SleepStages?
}

public struct SleepStages: Codable {
    public var awake: Double
    public var rem: Double
    public var core: Double
    public var deep: Double
    public var inBed: Double

    public var totalAsleep: Double {
        rem + core + deep
    }
}
```

## Fetching Patterns

### Daily Statistics

For cumulative metrics (steps, calories), use statistics collection:

```swift
func fetchLastTwoWeeksQuantityData(
    for identifier: HKQuantityTypeIdentifier,
    unit: HKUnit,
    options: HKStatisticsOptions
) async throws -> [Double] {
    let quantityType = HKObjectType.quantityType(forIdentifier: identifier)!
    let predicate = createLastTwoWeeksPredicate()

    let query = HKStatisticsCollectionQueryDescriptor(
        predicate: HKSamplePredicate.quantitySample(type: quantityType, predicate: predicate),
        options: options,
        anchorDate: Date.startOfDay(),
        intervalComponents: DateComponents(day: 1)
    )

    let results = try await query.result(for: healthStore)
    var dailyData = [Double]()

    results.enumerateStatistics(from: twoWeeksAgo, to: today) { statistics, _ in
        if let sum = statistics.sumQuantity() {
            dailyData.append(sum.doubleValue(for: unit))
        } else if let avg = statistics.averageQuantity() {
            dailyData.append(avg.doubleValue(for: unit))
        } else {
            dailyData.append(0)
        }
    }

    return dailyData
}
```

### Sleep Analysis

Sleep requires special handling for overnight sessions:

```swift
func fetchLastTwoWeeksSleep() async throws -> [Double] {
    var dailySleepData: [Double] = []

    for day in -14..<0 {
        // Sleep window: 3pm previous day to 3pm current day
        let startOfSleep = calendar.date(bySettingHour: 15, minute: 0, second: 0, of: previousDay)
        let endOfSleep = calendar.date(bySettingHour: 15, minute: 0, second: 0, of: currentDay)

        let sleepType = HKCategoryType(.sleepAnalysis)
        let dateRangePredicate = HKQuery.predicateForSamples(
            withStart: startOfSleep,
            end: endOfSleep,
            options: .strictEndDate
        )
        let asleepPredicate = HKCategoryValueSleepAnalysis.predicateForSamples(
            equalTo: HKCategoryValueSleepAnalysis.allAsleepValues
        )

        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: compoundPredicate)],
            sortDescriptors: []
        )

        let results = try await descriptor.result(for: healthStore)
        let secondsAsleep = results.reduce(0.0) { total, sample in
            total + sample.endDate.timeIntervalSince(sample.startDate)
        }

        dailySleepData.append(secondsAsleep / 3600) // Convert to hours
    }

    return dailySleepData
}
```

## Background Sync

### Enable Background Delivery

```swift
func enableBackgroundDelivery() {
    let types: [HKSampleType] = [
        HKQuantityType(.stepCount),
        HKQuantityType(.heartRate),
        HKQuantityType(.heartRateVariabilitySDNN),
        HKCategoryType(.sleepAnalysis)
    ]

    for type in types {
        healthStore.enableBackgroundDelivery(for: type, frequency: .hourly) { success, error in
            if success {
                print("Background delivery enabled for \(type)")
            }
        }
    }
}
```

### Observer Query

```swift
func setupBackgroundObservers() {
    let sleepType = HKCategoryType(.sleepAnalysis)

    let query = HKObserverQuery(sampleType: sleepType, predicate: nil) { _, completionHandler, error in
        Task {
            try? await self.performSync()
            completionHandler()
        }
    }

    healthStore.execute(query)
}
```

## Testing HealthKit

### Simulator Limitations

- No real health data in simulator
- Use mock data for development
- Physical device required for real testing

### Feature Flags

```swift
// Skip actual HealthKit in previews
if ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1" {
    try await Task.sleep(for: .seconds(1))
    return
}
```

### Mock Data

```swift
static func createSampleHealthData() -> [HealthData] {
    var healthData: [HealthData] = []
    for day in 0...13 {
        healthData.append(HealthData(
            date: dateString,
            steps: Double.random(in: 5000..<10000),
            sleepHours: Double.random(in: 4..<9),
            activeEnergy: Double.random(in: 100..<500)
        ))
    }
    return healthData
}
```

## Entitlements

The app requires HealthKit entitlement in `MapHealth.entitlements`:

```xml
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.developer.healthkit.access</key>
<array>
    <string>health-records</string>
</array>
<key>com.apple.developer.healthkit.background-delivery</key>
<true/>
```

## Info.plist

Required usage descriptions:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Map Health needs access to your health data to provide personalized insights.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Map Health may save wellness insights to your Health app.</string>
```
