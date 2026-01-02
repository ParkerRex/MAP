import HealthKit

public final class HealthKitAuthorizationManager: ObservableObject {
    private let healthStore = HKHealthStore()

    public init() {}

    public func requestAuthorization() async throws {
        let readTypes: Set<HKSampleType> = [
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
            HKCategoryType(.sleepAnalysis),
            HKCategoryType(.mindfulSession)
        ]

        try await healthStore.requestAuthorization(toShare: [], read: readTypes)
    }
}
