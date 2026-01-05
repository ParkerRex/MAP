import Foundation
import HealthKit

// MARK: - Health Snapshot (Today's data with trends)

public struct HealthSnapshot {
    public let timestamp: Date
    public let today: HealthData
    public let history: [HealthData]  // Last 14 days, oldest first

    // Computed trends
    public var stepsTrend: Trend? { Trend.calculate(current: today.steps, history: history.map(\.steps)) }
    public var caloriesTrend: Trend? { Trend.calculate(current: today.activeEnergy, history: history.map(\.activeEnergy)) }
    public var exerciseTrend: Trend? { Trend.calculate(current: today.exerciseMinutes, history: history.map(\.exerciseMinutes)) }
    public var standTrend: Trend? { Trend.calculate(current: today.standMinutes, history: history.map(\.standMinutes)) }
    public var sleepTrend: Trend? { Trend.calculate(current: today.sleepHours, history: history.map(\.sleepHours)) }
    public var restingHRTrend: Trend? { Trend.calculate(current: today.restingHeartRate, history: history.map(\.restingHeartRate), higherIsBetter: false) }
    public var hrvTrend: Trend? { Trend.calculate(current: today.hrvSDNN, history: history.map(\.hrvSDNN)) }

    // Averages
    public var sleepAverage7d: Double? {
        let recent = history.suffix(7).compactMap(\.sleepHours).filter { $0 > 0 }
        guard !recent.isEmpty else { return nil }
        return recent.reduce(0, +) / Double(recent.count)
    }

    public var stepsAverage7d: Double? {
        let recent = history.suffix(7).compactMap(\.steps).filter { $0 > 0 }
        guard !recent.isEmpty else { return nil }
        return recent.reduce(0, +) / Double(recent.count)
    }
}

// MARK: - Trend

public struct Trend {
    public let percentChange: Double
    public let isPositive: Bool
    public let label: String

    public static func calculate(current: Double?, history: [Double?], higherIsBetter: Bool = true) -> Trend? {
        guard let current, current > 0 else { return nil }
        let valid = history.compactMap { $0 }.filter { $0 > 0 }
        guard valid.count >= 3 else { return nil }

        let previous = Array(valid.dropLast()).suffix(7)
        guard !previous.isEmpty else { return nil }

        let avg = previous.reduce(0, +) / Double(previous.count)
        guard avg > 0 else { return nil }

        let delta = (current - avg) / avg
        let magnitude = abs(delta)

        if magnitude < 0.02 {
            return Trend(percentChange: 0, isPositive: true, label: "Avg")
        }

        let percent = Int((magnitude * 100).rounded())
        let arrow = delta >= 0 ? "+" : "-"
        let isPositive = higherIsBetter ? delta >= 0 : delta <= 0

        return Trend(percentChange: delta, isPositive: isPositive, label: "\(arrow)\(percent)%")
    }
}

// MARK: - Health Data Service

@MainActor
public final class HealthDataService: ObservableObject {
    public static let shared = HealthDataService()

    @Published public private(set) var snapshot: HealthSnapshot?
    @Published public private(set) var isLoading = false
    @Published public private(set) var error: Error?
    @Published public private(set) var needsPermission = false

    private let healthStore = HKHealthStore()
    private var lastFetch: Date?
    private let cacheTimeout: TimeInterval = 60  // 1 minute cache

    private init() {}

    // MARK: - Public API

    /// Refresh data if cache is stale
    public func refreshIfNeeded() async {
        if let lastFetch, Date().timeIntervalSince(lastFetch) < cacheTimeout {
            return  // Cache is fresh
        }
        await refresh()
    }

    /// Force refresh all data
    public func refresh() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            error = HealthDataError.notAvailable
            return
        }

        isLoading = true
        error = nil

        do {
            let healthData = try await fetchAllHealthData()

            guard let today = healthData.last else {
                needsPermission = true
                isLoading = false
                return
            }

            // Check if we have any actual data
            let hasData = healthData.contains { data in
                data.steps ?? 0 > 0 ||
                data.activeEnergy ?? 0 > 0 ||
                data.sleepHours ?? 0 > 0 ||
                data.restingHeartRate ?? 0 > 0
            }

            if !hasData {
                needsPermission = true
                isLoading = false
                return
            }

            needsPermission = false
            snapshot = HealthSnapshot(
                timestamp: Date(),
                today: today,
                history: Array(healthData.dropLast())
            )
            lastFetch = Date()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    /// Clear cache and force fresh fetch
    public func invalidateCache() {
        lastFetch = nil
        snapshot = nil
    }

    // MARK: - Fetch All Data

    private func fetchAllHealthData() async throws -> [HealthData] {
        let calendar = Calendar.current
        let now = Date()
        let days = 15  // 14 days history + today

        guard let startDate = calendar.date(byAdding: .day, value: -(days - 1), to: calendar.startOfDay(for: now)) else {
            return []
        }

        // Fetch all data types in parallel
        async let stepsData = fetchQuantityData(.stepCount, unit: .count(), options: .cumulativeSum, days: days)
        async let caloriesData = fetchQuantityData(.activeEnergyBurned, unit: .largeCalorie(), options: .cumulativeSum, days: days)
        async let exerciseData = fetchQuantityData(.appleExerciseTime, unit: .minute(), options: .cumulativeSum, days: days)
        async let standData = fetchQuantityData(.appleStandTime, unit: .minute(), options: .cumulativeSum, days: days)
        async let restingHRData = fetchQuantityData(.restingHeartRate, unit: .count().unitDivided(by: .minute()), options: .discreteAverage, days: days)
        async let hrvData = fetchQuantityData(.heartRateVariabilitySDNN, unit: .secondUnit(with: .milli), options: .discreteAverage, days: days)
        async let sleepData = fetchSleepData(days: days)

        let (steps, calories, exercise, stand, restingHR, hrv, sleep) = try await (
            stepsData, caloriesData, exerciseData, standData, restingHRData, hrvData, sleepData
        )

        // Build HealthData objects for each day
        var result: [HealthData] = []
        let dateFormatter = ISO8601DateFormatter()

        for dayIndex in 0..<days {
            guard let date = calendar.date(byAdding: .day, value: dayIndex, to: startDate) else { continue }

            let data = HealthData(
                date: dateFormatter.string(from: date),
                steps: dayIndex < steps.count ? steps[dayIndex] : nil,
                activeEnergy: dayIndex < calories.count ? calories[dayIndex] : nil,
                exerciseMinutes: dayIndex < exercise.count ? exercise[dayIndex] : nil,
                standMinutes: dayIndex < stand.count ? stand[dayIndex] : nil,
                restingHeartRate: dayIndex < restingHR.count ? restingHR[dayIndex] : nil,
                hrvSDNN: dayIndex < hrv.count ? hrv[dayIndex] : nil,
                sleepHours: dayIndex < sleep.hours.count ? sleep.hours[dayIndex] : nil,
                sleepStages: dayIndex < sleep.stages.count ? sleep.stages[dayIndex] : nil
            )
            result.append(data)
        }

        return result
    }

    // MARK: - Quantity Data (generic)

    private func fetchQuantityData(
        _ identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        options: HKStatisticsOptions,
        days: Int
    ) async throws -> [Double?] {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: identifier) else {
            return Array(repeating: nil, count: days)
        }

        let calendar = Calendar.current
        let now = Date()
        let startDate = calendar.date(byAdding: .day, value: -(days - 1), to: calendar.startOfDay(for: now))!

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        let samplePredicate = HKSamplePredicate.quantitySample(type: quantityType, predicate: predicate)

        let query = HKStatisticsCollectionQueryDescriptor(
            predicate: samplePredicate,
            options: options,
            anchorDate: calendar.startOfDay(for: now),
            intervalComponents: DateComponents(day: 1)
        )

        let collection = try await query.result(for: healthStore)

        var results: [Double?] = Array(repeating: nil, count: days)

        collection.enumerateStatistics(from: startDate, to: now) { stats, _ in
            let dayIndex = calendar.dateComponents([.day], from: startDate, to: stats.startDate).day ?? 0
            guard dayIndex >= 0, dayIndex < days else { return }

            if let sum = stats.sumQuantity() {
                let value = sum.doubleValue(for: unit)
                results[dayIndex] = value > 0 ? value : nil
            } else if let avg = stats.averageQuantity() {
                let value = avg.doubleValue(for: unit)
                results[dayIndex] = value > 0 ? value : nil
            }
        }

        return results
    }

    // MARK: - Sleep Data (optimized single query)

    private func fetchSleepData(days: Int) async throws -> (hours: [Double?], stages: [SleepStages?]) {
        let calendar = Calendar.current
        let now = Date()
        let startDate = calendar.date(byAdding: .day, value: -days, to: now)!

        let sleepType = HKCategoryType(.sleepAnalysis)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictEndDate)

        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate, order: .forward)]
        )

        let samples = try await descriptor.result(for: healthStore)
        let deduped = deduplicateSleepSamples(samples)

        // Group by wake-up day
        var hoursByDay: [Date: Double] = [:]
        var stagesByDay: [Date: SleepStages] = [:]

        for sample in deduped {
            let wakeDay = calendar.startOfDay(for: sample.endDate)
            let duration = sample.endDate.timeIntervalSince(sample.startDate) / 3600

            let isAsleep = [
                HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                HKCategoryValueSleepAnalysis.asleepREM.rawValue,
                HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue
            ].contains(sample.value)

            if isAsleep {
                hoursByDay[wakeDay, default: 0] += duration
            }

            // Initialize stages if needed
            if stagesByDay[wakeDay] == nil {
                stagesByDay[wakeDay] = SleepStages(awake: 0, rem: 0, core: 0, deep: 0, inBed: 0)
            }

            switch sample.value {
            case HKCategoryValueSleepAnalysis.awake.rawValue:
                stagesByDay[wakeDay]?.awake += duration
            case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                stagesByDay[wakeDay]?.rem += duration
            case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                stagesByDay[wakeDay]?.core += duration
            case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                stagesByDay[wakeDay]?.deep += duration
            case HKCategoryValueSleepAnalysis.inBed.rawValue:
                stagesByDay[wakeDay]?.inBed += duration
            case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                stagesByDay[wakeDay]?.core += duration
            default:
                break
            }
        }

        // Build arrays
        var hours: [Double?] = []
        var stages: [SleepStages?] = []
        let dayStart = calendar.date(byAdding: .day, value: -(days - 1), to: calendar.startOfDay(for: now))!

        for dayIndex in 0..<days {
            guard let day = calendar.date(byAdding: .day, value: dayIndex, to: dayStart) else {
                hours.append(nil)
                stages.append(nil)
                continue
            }

            let h = hoursByDay[day]
            hours.append(h.flatMap { $0 > 0 ? $0 : nil })
            stages.append(stagesByDay[day])
        }

        return (hours, stages)
    }

    private func deduplicateSleepSamples(_ samples: [HKCategorySample]) -> [HKCategorySample] {
        guard !samples.isEmpty else { return [] }

        let sorted = samples.sorted { lhs, rhs in
            if lhs.startDate != rhs.startDate {
                return lhs.startDate < rhs.startDate
            }
            return lhs.endDate.timeIntervalSince(lhs.startDate) > rhs.endDate.timeIntervalSince(rhs.startDate)
        }

        var result: [HKCategorySample] = []
        // Track coverage per sleep value so "in bed" doesn't mask asleep stages.
        var coveredUntilByValue: [Int: Date] = [:]

        for sample in sorted {
            let coveredUntil = coveredUntilByValue[sample.value] ?? .distantPast
            if sample.endDate <= coveredUntil { continue }
            result.append(sample)
            if sample.endDate > coveredUntil {
                coveredUntilByValue[sample.value] = sample.endDate
            }
        }

        return result
    }
}

// MARK: - Errors

public enum HealthDataError: LocalizedError {
    case notAvailable
    case noPermission
    case noData

    public var errorDescription: String? {
        switch self {
        case .notAvailable: return "HealthKit is not available on this device"
        case .noPermission: return "Please grant access to Health data"
        case .noData: return "No health data found"
        }
    }
}
