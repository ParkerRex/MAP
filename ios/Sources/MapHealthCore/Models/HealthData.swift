import Foundation

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

    public init(
        date: String,
        steps: Double? = nil,
        activeEnergy: Double? = nil,
        basalEnergy: Double? = nil,
        exerciseMinutes: Double? = nil,
        standMinutes: Double? = nil,
        distanceMiles: Double? = nil,
        flightsClimbed: Double? = nil,
        restingHeartRate: Double? = nil,
        hrvSDNN: Double? = nil,
        walkingHeartRate: Double? = nil,
        vo2Max: Double? = nil,
        oxygenSaturation: Double? = nil,
        respiratoryRate: Double? = nil,
        bodyWeight: Double? = nil,
        bodyFatPercentage: Double? = nil,
        leanBodyMass: Double? = nil,
        sleepHours: Double? = nil,
        sleepStages: SleepStages? = nil
    ) {
        self.date = date
        self.steps = steps
        self.activeEnergy = activeEnergy
        self.basalEnergy = basalEnergy
        self.exerciseMinutes = exerciseMinutes
        self.standMinutes = standMinutes
        self.distanceMiles = distanceMiles
        self.flightsClimbed = flightsClimbed
        self.restingHeartRate = restingHeartRate
        self.hrvSDNN = hrvSDNN
        self.walkingHeartRate = walkingHeartRate
        self.vo2Max = vo2Max
        self.oxygenSaturation = oxygenSaturation
        self.respiratoryRate = respiratoryRate
        self.bodyWeight = bodyWeight
        self.bodyFatPercentage = bodyFatPercentage
        self.leanBodyMass = leanBodyMass
        self.sleepHours = sleepHours
        self.sleepStages = sleepStages
    }
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

    public init(awake: Double, rem: Double, core: Double, deep: Double, inBed: Double) {
        self.awake = awake
        self.rem = rem
        self.core = core
        self.deep = deep
        self.inBed = inBed
    }
}

/// Payload for syncing to Map backend
public struct HealthSyncPayload: Codable {
    public var syncedAt: String
    public var deviceId: String
    public var healthData: [HealthData]

    public init(syncedAt: String, deviceId: String, healthData: [HealthData]) {
        self.syncedAt = syncedAt
        self.deviceId = deviceId
        self.healthData = healthData
    }
}
