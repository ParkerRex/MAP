import Foundation

struct HealthData: Codable {
    var date: String

    // Activity
    var steps: Double?
    var activeEnergy: Double?
    var basalEnergy: Double?
    var exerciseMinutes: Double?
    var standMinutes: Double?
    var distanceMiles: Double?
    var flightsClimbed: Double?

    // Heart & Recovery
    var restingHeartRate: Double?
    var hrvSDNN: Double?
    var walkingHeartRate: Double?
    var vo2Max: Double?
    var oxygenSaturation: Double?
    var respiratoryRate: Double?

    // Body
    var bodyWeight: Double?
    var bodyFatPercentage: Double?
    var leanBodyMass: Double?

    // Sleep
    var sleepHours: Double?
    var sleepStages: SleepStages?
}

struct SleepStages: Codable {
    var awake: Double
    var rem: Double
    var core: Double
    var deep: Double
    var inBed: Double

    var totalAsleep: Double {
        rem + core + deep
    }
}

/// Payload for syncing to Map backend
struct HealthSyncPayload: Codable {
    var syncedAt: String
    var deviceId: String
    var healthData: [HealthData]
}
