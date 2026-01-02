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
            anchorDate: Date.startOfDay(),
            intervalComponents: DateComponents(day: 1)
        )

        let quantityCounts = try await query.result(for: healthStore)
        var dailyData = [Double]()

        quantityCounts.enumerateStatistics(
            from: Date().twoWeeksAgoStartOfDay(),
            to: Date.startOfDay()
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

    public func fetchLastTwoWeeksSleep() async throws -> [Double] {
        var dailySleepData: [Double] = []

        for day in -14..<0 {
            guard let startOfSleepDay = Calendar.current.date(byAdding: DateComponents(day: day - 1), to: Date.startOfDay()),
                  let startOfSleep = Calendar.current.date(bySettingHour: 15, minute: 0, second: 0, of: startOfSleepDay),
                  let endOfSleepDay = Calendar.current.date(byAdding: DateComponents(day: day), to: Date.startOfDay()),
                  let endOfSleep = Calendar.current.date(bySettingHour: 15, minute: 0, second: 0, of: endOfSleepDay) else {
                dailySleepData.append(0)
                continue
            }

            let sleepType = HKCategoryType(.sleepAnalysis)
            let dateRangePredicate = HKQuery.predicateForSamples(withStart: startOfSleep, end: endOfSleep, options: .strictEndDate)
            let allAsleepValuesPredicate = HKCategoryValueSleepAnalysis.predicateForSamples(equalTo: HKCategoryValueSleepAnalysis.allAsleepValues)
            let compoundPredicate = NSCompoundPredicate(andPredicateWithSubpredicates: [dateRangePredicate, allAsleepValuesPredicate])

            let descriptor = HKSampleQueryDescriptor(
                predicates: [.categorySample(type: sleepType, predicate: compoundPredicate)],
                sortDescriptors: []
            )

            let results = try await descriptor.result(for: healthStore)
            var secondsAsleep = 0.0
            for result in results {
                secondsAsleep += result.endDate.timeIntervalSince(result.startDate)
            }

            dailySleepData.append(secondsAsleep / (60 * 60))
        }

        return dailySleepData
    }

    /// Fetches detailed sleep stages for the last two weeks
    public func fetchLastTwoWeeksSleepStages() async throws -> [[String: Double]] {
        var dailySleepStages: [[String: Double]] = []

        for day in -14..<0 {
            guard let startOfSleepDay = Calendar.current.date(byAdding: DateComponents(day: day - 1), to: Date.startOfDay()),
                  let startOfSleep = Calendar.current.date(bySettingHour: 15, minute: 0, second: 0, of: startOfSleepDay),
                  let endOfSleepDay = Calendar.current.date(byAdding: DateComponents(day: day), to: Date.startOfDay()),
                  let endOfSleep = Calendar.current.date(bySettingHour: 15, minute: 0, second: 0, of: endOfSleepDay) else {
                dailySleepStages.append([:])
                continue
            }

            let sleepType = HKCategoryType(.sleepAnalysis)
            let dateRangePredicate = HKQuery.predicateForSamples(withStart: startOfSleep, end: endOfSleep, options: .strictEndDate)

            let descriptor = HKSampleQueryDescriptor(
                predicates: [.categorySample(type: sleepType, predicate: dateRangePredicate)],
                sortDescriptors: []
            )

            let results = try await descriptor.result(for: healthStore)

            var stages: [String: Double] = [
                "awake": 0,
                "rem": 0,
                "core": 0,
                "deep": 0,
                "inBed": 0
            ]

            for result in results {
                let duration = result.endDate.timeIntervalSince(result.startDate) / 3600 // hours
                switch result.value {
                case HKCategoryValueSleepAnalysis.awake.rawValue:
                    stages["awake", default: 0] += duration
                case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                    stages["rem", default: 0] += duration
                case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                    stages["core", default: 0] += duration
                case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                    stages["deep", default: 0] += duration
                case HKCategoryValueSleepAnalysis.inBed.rawValue:
                    stages["inBed", default: 0] += duration
                default:
                    break
                }
            }

            dailySleepStages.append(stages)
        }

        return dailySleepStages
    }

    // MARK: - Helpers

    private func createLastTwoWeeksPredicate() -> NSPredicate {
        let now = Date()
        let startDate = Calendar.current.date(byAdding: DateComponents(day: -14), to: now) ?? Date()
        return HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
    }
}
