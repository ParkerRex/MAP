import Foundation
import HealthKit

/// Service for syncing Apple Health data to Convex
@MainActor
public final class ConvexHealthSync: ObservableObject {
    public static let shared = ConvexHealthSync()

    @Published public private(set) var isSyncing = false
    @Published public private(set) var lastSyncDate: Date?
    @Published public private(set) var error: Error?

    private let convexClient: ConvexClient
    private let healthFetcher: HealthDataFetcher
    private let dateFormatter: DateFormatter

    public init(
        convexClient: ConvexClient = .shared,
        healthFetcher: HealthDataFetcher = HealthDataFetcher()
    ) {
        self.convexClient = convexClient
        self.healthFetcher = healthFetcher

        self.dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
    }

    // MARK: - Sync Methods

    /// Sync last 14 days of health data to Convex
    public func syncHealthData() async -> Bool {
        guard !isSyncing else { return false }

        isSyncing = true
        error = nil

        do {
            // Fetch all health metrics concurrently
            async let steps = healthFetcher.fetchLastTwoWeeksStepCount()
            async let activeEnergy = healthFetcher.fetchLastTwoWeeksActiveEnergy()
            async let basalEnergy = healthFetcher.fetchLastTwoWeeksBasalEnergy()
            async let exerciseMinutes = healthFetcher.fetchLastTwoWeeksExerciseTime()
            async let standMinutes = healthFetcher.fetchLastTwoWeeksStandTime()
            async let distance = healthFetcher.fetchLastTwoWeeksDistance()
            async let flightsClimbed = healthFetcher.fetchLastTwoWeeksFlightsClimbed()
            async let restingHeartRate = healthFetcher.fetchLastTwoWeeksRestingHeartRate()
            async let hrv = healthFetcher.fetchLastTwoWeeksHRV()
            async let walkingHeartRate = healthFetcher.fetchLastTwoWeeksWalkingHeartRate()
            async let vo2Max = healthFetcher.fetchLastTwoWeeksVO2Max()
            async let oxygenSaturation = healthFetcher.fetchLastTwoWeeksOxygenSaturation()
            async let respiratoryRate = healthFetcher.fetchLastTwoWeeksRespiratoryRate()
            async let bodyWeight = healthFetcher.fetchLastTwoWeeksBodyWeight()
            async let bodyFat = healthFetcher.fetchLastTwoWeeksBodyFat()
            async let leanBodyMass = healthFetcher.fetchLastTwoWeeksLeanBodyMass()
            async let sleep = healthFetcher.fetchLastTwoWeeksSleep()
            async let sleepStages = healthFetcher.fetchLastTwoWeeksSleepStages()

            // Await all results
            let allSteps = try await steps
            let allActiveEnergy = try await activeEnergy
            let allBasalEnergy = try await basalEnergy
            let allExerciseMinutes = try await exerciseMinutes
            let allStandMinutes = try await standMinutes
            let allDistance = try await distance
            let allFlightsClimbed = try await flightsClimbed
            let allRestingHeartRate = try await restingHeartRate
            let allHRV = try await hrv
            let allWalkingHeartRate = try await walkingHeartRate
            let allVO2Max = try await vo2Max
            let allOxygenSaturation = try await oxygenSaturation
            let allRespiratoryRate = try await respiratoryRate
            let allBodyWeight = try await bodyWeight
            let allBodyFat = try await bodyFat
            let allLeanBodyMass = try await leanBodyMass
            let allSleep = try await sleep
            let allSleepStages = try await sleepStages

            // Build health data for each day
            let calendar = Calendar.current
            let today = calendar.startOfDay(for: Date())

            for dayOffset in 0..<14 {
                guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) else {
                    continue
                }

                let dateString = dateFormatter.string(from: date)
                let index = 14 - dayOffset - 1 // Arrays are oldest to newest

                guard index >= 0 && index < allSteps.count else { continue }

                // Get sleep stages for this day
                let stages = index < allSleepStages.count ? allSleepStages[index] : [:]

                let healthData = ConvexHealthData(
                    date: dateString,
                    steps: allSteps[index] > 0 ? Int(allSteps[index]) : nil,
                    activeEnergy: allActiveEnergy[index] > 0 ? allActiveEnergy[index] : nil,
                    basalEnergy: allBasalEnergy[index] > 0 ? allBasalEnergy[index] : nil,
                    exerciseMinutes: allExerciseMinutes[index] > 0 ? Int(allExerciseMinutes[index]) : nil,
                    standMinutes: allStandMinutes[index] > 0 ? Int(allStandMinutes[index]) : nil,
                    distanceMiles: allDistance[index] > 0 ? allDistance[index] : nil,
                    flightsClimbed: allFlightsClimbed[index] > 0 ? Int(allFlightsClimbed[index]) : nil,
                    restingHeartRate: allRestingHeartRate[index] > 0 ? Int(allRestingHeartRate[index]) : nil,
                    hrvSDNN: allHRV[index] > 0 ? allHRV[index] : nil,
                    walkingHeartRate: allWalkingHeartRate[index] > 0 ? Int(allWalkingHeartRate[index]) : nil,
                    vo2Max: allVO2Max[index] > 0 ? allVO2Max[index] : nil,
                    oxygenSaturation: allOxygenSaturation[index] > 0 ? allOxygenSaturation[index] : nil,
                    respiratoryRate: allRespiratoryRate[index] > 0 ? allRespiratoryRate[index] : nil,
                    bodyWeight: allBodyWeight[index] > 0 ? allBodyWeight[index] : nil,
                    bodyFatPercentage: allBodyFat[index] > 0 ? allBodyFat[index] : nil,
                    leanBodyMass: allLeanBodyMass[index] > 0 ? allLeanBodyMass[index] : nil,
                    sleepHours: allSleep[index] > 0 ? allSleep[index] : nil,
                    sleepAwakeHours: stages["awake"],
                    sleepRemHours: stages["rem"],
                    sleepCoreHours: stages["core"],
                    sleepDeepHours: stages["deep"],
                    sleepInBedHours: stages["inBed"]
                )

                // Only sync if there's meaningful data for this day
                if hasData(healthData) {
                    _ = try await convexClient.upsertHealthData(healthData)
                }
            }

            lastSyncDate = Date()
            isSyncing = false
            return true
        } catch {
            self.error = error
            isSyncing = false
            return false
        }
    }

    /// Sync today's health data only (for quick updates)
    public func syncToday() async -> Bool {
        guard !isSyncing else { return false }

        isSyncing = true
        error = nil

        do {
            // Fetch today's data
            let today = Calendar.current.startOfDay(for: Date())
            let dateString = dateFormatter.string(from: today)

            // Fetch metrics (using the last two weeks fetchers but only use index 14 for today)
            async let steps = healthFetcher.fetchLastTwoWeeksStepCount()
            async let activeEnergy = healthFetcher.fetchLastTwoWeeksActiveEnergy()
            async let exerciseMinutes = healthFetcher.fetchLastTwoWeeksExerciseTime()
            async let restingHeartRate = healthFetcher.fetchLastTwoWeeksRestingHeartRate()
            async let hrv = healthFetcher.fetchLastTwoWeeksHRV()
            async let sleep = healthFetcher.fetchLastTwoWeeksSleep()
            async let sleepStages = healthFetcher.fetchLastTwoWeeksSleepStages()

            let allSteps = try await steps
            let allActiveEnergy = try await activeEnergy
            let allExerciseMinutes = try await exerciseMinutes
            let allRestingHeartRate = try await restingHeartRate
            let allHRV = try await hrv
            let allSleep = try await sleep
            let allSleepStages = try await sleepStages

            let todayIndex = allSteps.count - 1
            guard todayIndex >= 0 else {
                isSyncing = false
                return false
            }

            let stages = todayIndex < allSleepStages.count ? allSleepStages[todayIndex] : [:]

            let healthData = ConvexHealthData(
                date: dateString,
                steps: allSteps[todayIndex] > 0 ? Int(allSteps[todayIndex]) : nil,
                activeEnergy: allActiveEnergy[todayIndex] > 0 ? allActiveEnergy[todayIndex] : nil,
                exerciseMinutes: allExerciseMinutes[todayIndex] > 0 ? Int(allExerciseMinutes[todayIndex]) : nil,
                restingHeartRate: allRestingHeartRate[todayIndex] > 0 ? Int(allRestingHeartRate[todayIndex]) : nil,
                hrvSDNN: allHRV[todayIndex] > 0 ? allHRV[todayIndex] : nil,
                sleepHours: allSleep[todayIndex] > 0 ? allSleep[todayIndex] : nil,
                sleepAwakeHours: stages["awake"],
                sleepRemHours: stages["rem"],
                sleepCoreHours: stages["core"],
                sleepDeepHours: stages["deep"],
                sleepInBedHours: stages["inBed"]
            )

            if hasData(healthData) {
                _ = try await convexClient.upsertHealthData(healthData)
            }

            lastSyncDate = Date()
            isSyncing = false
            return true
        } catch {
            self.error = error
            isSyncing = false
            return false
        }
    }

    // MARK: - Helpers

    private func hasData(_ data: ConvexHealthData) -> Bool {
        // Check if any meaningful data exists
        return data.steps != nil ||
            data.activeEnergy != nil ||
            data.basalEnergy != nil ||
            data.exerciseMinutes != nil ||
            data.sleepHours != nil ||
            data.restingHeartRate != nil ||
            data.hrvSDNN != nil
    }
}
