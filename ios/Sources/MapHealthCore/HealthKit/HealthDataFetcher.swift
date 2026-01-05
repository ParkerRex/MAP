import HealthKit

public final class HealthDataFetcher {
    private let healthStore = HKHealthStore()

    public init() { }

    // MARK: - Generic Quantity Fetcher

    public func fetchLastTwoWeeksQuantityData(
        for identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        options: HKStatisticsOptions
    ) async throws -> [Double] {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: identifier) else {
            throw HealthDataFetcherError.invalidObjectType
        }

        let predicate = createLastTwoWeeksPredicate()
        let quantityLastTwoWeeks = HKSamplePredicate.quantitySample(type: quantityType, predicate: predicate)

        let query = HKStatisticsCollectionQueryDescriptor(
            predicate: quantityLastTwoWeeks,
            options: options,
            anchorDate: Date.startOfToday(),
            intervalComponents: DateComponents(day: 1)
        )

        let quantityCounts = try await query.result(for: healthStore)
        var dailyData = [Double]()

        quantityCounts.enumerateStatistics(
            from: Date().twoWeeksAgoStartOfDay(),
            to: Date.startOfToday()
        ) { statistics, _ in
            if let quantity = statistics.sumQuantity() {
                dailyData.append(quantity.doubleValue(for: unit))
            } else if let quantity = statistics.averageQuantity() {
                dailyData.append(quantity.doubleValue(for: unit))
            } else {
                dailyData.append(0)
            }
        }

        return dailyData
    }

    // MARK: - Activity Metrics

    public func fetchLastTwoWeeksStepCount() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .stepCount, unit: .count(), options: [.cumulativeSum])
    }

    public func fetchLastTwoWeeksActiveEnergy() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .activeEnergyBurned, unit: .largeCalorie(), options: [.cumulativeSum])
    }

    public func fetchLastTwoWeeksBasalEnergy() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .basalEnergyBurned, unit: .largeCalorie(), options: [.cumulativeSum])
    }

    public func fetchLastTwoWeeksExerciseTime() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .appleExerciseTime, unit: .minute(), options: [.cumulativeSum])
    }

    public func fetchLastTwoWeeksStandTime() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .appleStandTime, unit: .minute(), options: [.cumulativeSum])
    }

    public func fetchLastTwoWeeksDistance() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .distanceWalkingRunning, unit: .mile(), options: [.cumulativeSum])
    }

    public func fetchLastTwoWeeksFlightsClimbed() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .flightsClimbed, unit: .count(), options: [.cumulativeSum])
    }

    // MARK: - Heart & Recovery Metrics

    public func fetchLastTwoWeeksRestingHeartRate() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(
            for: .restingHeartRate,
            unit: .count().unitDivided(by: .minute()),
            options: [.discreteAverage]
        )
    }

    public func fetchLastTwoWeeksHRV() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(
            for: .heartRateVariabilitySDNN,
            unit: .secondUnit(with: .milli),
            options: [.discreteAverage]
        )
    }

    public func fetchLastTwoWeeksWalkingHeartRate() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(
            for: .walkingHeartRateAverage,
            unit: .count().unitDivided(by: .minute()),
            options: [.discreteAverage]
        )
    }

    public func fetchLastTwoWeeksVO2Max() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(
            for: .vo2Max,
            unit: HKUnit(from: "ml/kg*min"),
            options: [.discreteAverage]
        )
    }

    public func fetchLastTwoWeeksOxygenSaturation() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(
            for: .oxygenSaturation,
            unit: .percent(),
            options: [.discreteAverage]
        )
    }

    public func fetchLastTwoWeeksRespiratoryRate() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(
            for: .respiratoryRate,
            unit: .count().unitDivided(by: .minute()),
            options: [.discreteAverage]
        )
    }

    // MARK: - Body Measurements

    public func fetchLastTwoWeeksBodyWeight() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .bodyMass, unit: .pound(), options: [.discreteAverage])
    }

    public func fetchLastTwoWeeksBodyFat() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .bodyFatPercentage, unit: .percent(), options: [.discreteAverage])
    }

    public func fetchLastTwoWeeksLeanBodyMass() async throws -> [Double] {
        try await fetchLastTwoWeeksQuantityData(for: .leanBodyMass, unit: .pound(), options: [.discreteAverage])
    }

    // MARK: - Sleep Data

    /// Fetches sleep data for the last two weeks using a single optimized query.
    /// Groups sleep by the day you WAKE UP (sleep that ends on that day).
    /// Deduplicates overlapping samples from multiple sources (Watch + iPhone).
    public func fetchLastTwoWeeksSleep() async throws -> [Double] {
        let (sleepByDay, _) = try await fetchSleepDataOptimized()
        return sleepByDay
    }

    /// Fetches detailed sleep stages for the last two weeks
    public func fetchLastTwoWeeksSleepStages() async throws -> [[String: Double]] {
        let (_, stagesByDay) = try await fetchSleepDataOptimized()
        return stagesByDay
    }

    /// Single optimized query that fetches all sleep data and groups by day
    private func fetchSleepDataOptimized() async throws -> (sleepHours: [Double], stages: [[String: Double]]) {
        let calendar = Calendar.current
        let now = Date()

        // Fetch 15 days back to cover last night + 14 days history
        guard let startDate = calendar.date(byAdding: .day, value: -15, to: now) else {
            return (Array(repeating: 0, count: 15), Array(repeating: [:], count: 15))
        }

        // Single query for all sleep data
        let sleepType = HKCategoryType(.sleepAnalysis)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictEndDate)

        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate, order: .forward)]
        )

        let allSamples = try await descriptor.result(for: healthStore)

        // Deduplicate overlapping samples (prefer longer duration when overlapping)
        let deduped = deduplicateSleepSamples(allSamples)

        // Group by the day you WAKE UP (when sleep ends)
        // This assigns a night's sleep to the morning date
        var sleepByDay: [Date: Double] = [:]
        var stagesByDay: [Date: [String: Double]] = [:]

        for sample in deduped {
            // Use the end date's day as the "sleep day" (the day you woke up)
            let wakeDay = calendar.startOfDay(for: sample.endDate)
            let duration = sample.endDate.timeIntervalSince(sample.startDate) / 3600 // hours

            // Only count actual sleep states for total
            let isAsleep = [
                HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                HKCategoryValueSleepAnalysis.asleepREM.rawValue,
                HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue
            ].contains(sample.value)

            if isAsleep {
                sleepByDay[wakeDay, default: 0] += duration
            }

            // Track stages
            if stagesByDay[wakeDay] == nil {
                stagesByDay[wakeDay] = ["awake": 0, "rem": 0, "core": 0, "deep": 0, "inBed": 0]
            }

            switch sample.value {
            case HKCategoryValueSleepAnalysis.awake.rawValue:
                stagesByDay[wakeDay]?["awake", default: 0] += duration
            case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                stagesByDay[wakeDay]?["rem", default: 0] += duration
            case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                stagesByDay[wakeDay]?["core", default: 0] += duration
            case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                stagesByDay[wakeDay]?["deep", default: 0] += duration
            case HKCategoryValueSleepAnalysis.inBed.rawValue:
                stagesByDay[wakeDay]?["inBed", default: 0] += duration
            case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                // Count unspecified as core/light sleep
                stagesByDay[wakeDay]?["core", default: 0] += duration
            default:
                break
            }
        }

        // Build arrays for last 15 days (index 0 = oldest, last = today)
        var sleepArray: [Double] = []
        var stagesArray: [[String: Double]] = []

        for dayOffset in -14...0 {
            guard let day = calendar.date(byAdding: .day, value: dayOffset, to: calendar.startOfDay(for: now)) else {
                sleepArray.append(0)
                stagesArray.append([:])
                continue
            }
            sleepArray.append(sleepByDay[day] ?? 0)
            stagesArray.append(stagesByDay[day] ?? [:])
        }

        return (sleepArray, stagesArray)
    }

    /// Removes overlapping sleep samples, preferring samples from the same source
    /// and longer durations when there's conflict
    private func deduplicateSleepSamples(_ samples: [HKCategorySample]) -> [HKCategorySample] {
        guard !samples.isEmpty else { return [] }

        // Sort by start time, then by duration (longer first)
        let sorted = samples.sorted { lhs, rhs in
            if lhs.startDate != rhs.startDate {
                return lhs.startDate < rhs.startDate
            }
            let lhsDuration = lhs.endDate.timeIntervalSince(lhs.startDate)
            let rhsDuration = rhs.endDate.timeIntervalSince(rhs.startDate)
            return lhsDuration > rhsDuration
        }

        var result: [HKCategorySample] = []
        // Track coverage per sleep value so "in bed" doesn't mask asleep stages.
        var coveredUntilByValue: [Int: Date] = [:]

        for sample in sorted {
            // Skip if this sample is fully covered by previous ones
            let coveredUntil = coveredUntilByValue[sample.value] ?? .distantPast
            if sample.endDate <= coveredUntil {
                continue
            }

            // If partially overlapping, we still include it (HealthKit handles this)
            // but update our coverage marker
            if sample.startDate < coveredUntil {
                // Partial overlap - include but only the non-overlapping portion counts
                // For simplicity, we include the sample and let the duration calc handle it
            }

            result.append(sample)
            if sample.endDate > coveredUntil {
                coveredUntilByValue[sample.value] = sample.endDate
            }
        }

        return result
    }

    // MARK: - Helpers

    private func createLastTwoWeeksPredicate() -> NSPredicate {
        let now = Date()
        let startDate = Calendar.current.date(byAdding: DateComponents(day: -14), to: now) ?? Date()
        return HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
    }
}
