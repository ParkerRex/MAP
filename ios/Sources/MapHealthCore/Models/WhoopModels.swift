import Foundation

// MARK: - WHOOP Profile

public struct WhoopProfile: Codable {
    public var userId: String
    public var whoopUserId: String?
    public var email: String?
    public var firstName: String?
    public var lastName: String?
    public var heightMeter: String?
    public var weightKilogram: String?
    public var maxHeartRate: Int?
    public var lastSyncedAt: String?
    public var createdAt: String?
    public var updatedAt: String?

    public init(
        userId: String,
        whoopUserId: String? = nil,
        email: String? = nil,
        firstName: String? = nil,
        lastName: String? = nil
    ) {
        self.userId = userId
        self.whoopUserId = whoopUserId
        self.email = email
        self.firstName = firstName
        self.lastName = lastName
    }

    public var displayName: String {
        if let first = firstName, let last = lastName {
            return "\(first) \(last)"
        }
        return firstName ?? lastName ?? email ?? "WHOOP User"
    }
}

// MARK: - WHOOP Cycle

public struct WhoopCycle: Codable, Identifiable {
    public var id: String
    public var userId: String
    public var whoopUserId: String?
    public var start: String
    public var end: String?
    public var scoreState: String?
    public var strain: String?
    public var kilojoule: String?
    public var averageHeartRate: Int?
    public var maxHeartRate: Int?
    public var createdAt: String?
    public var updatedAt: String?

    public init(
        id: String,
        userId: String,
        start: String
    ) {
        self.id = id
        self.userId = userId
        self.start = start
    }

    public var strainValue: Double? {
        guard let strain = strain else { return nil }
        return Double(strain)
    }

    public var kilojouleValue: Double? {
        guard let kj = kilojoule else { return nil }
        return Double(kj)
    }

    public var caloriesBurned: Double? {
        guard let kj = kilojouleValue else { return nil }
        return kj / 4.184 // Convert kJ to kcal
    }
}

// MARK: - WHOOP Recovery

public struct WhoopRecovery: Codable, Identifiable {
    public var id: String
    public var userId: String
    public var cycleId: String
    public var sleepId: String?
    public var scoreState: String?
    public var recoveryScore: Int?
    public var restingHeartRate: String?
    public var hrvRmssd: String?
    public var spo2Percentage: String?
    public var skinTempCelsius: String?
    public var createdAt: String?
    public var updatedAt: String?

    public init(
        id: String,
        userId: String,
        cycleId: String
    ) {
        self.id = id
        self.userId = userId
        self.cycleId = cycleId
    }

    public var restingHR: Double? {
        guard let rhr = restingHeartRate else { return nil }
        return Double(rhr)
    }

    public var hrv: Double? {
        guard let hrvValue = hrvRmssd else { return nil }
        return Double(hrvValue)
    }

    public var spo2: Double? {
        guard let spo2 = spo2Percentage else { return nil }
        return Double(spo2)
    }

    public var skinTemp: Double? {
        guard let temp = skinTempCelsius else { return nil }
        return Double(temp)
    }

    public var skinTempFahrenheit: Double? {
        guard let celsius = skinTemp else { return nil }
        return celsius * 9 / 5 + 32
    }
}

// MARK: - WHOOP Sleep

public struct WhoopSleep: Codable, Identifiable {
    public var id: String
    public var userId: String
    public var cycleId: String?
    public var start: String
    public var end: String?
    public var isNap: Bool?
    public var scoreState: String?
    public var totalInBedTime: Int?
    public var totalAwakeTime: Int?
    public var totalNoDataTime: Int?
    public var totalLightSleepTime: Int?
    public var totalSlowWaveSleepTime: Int?
    public var totalRemSleepTime: Int?
    public var sleepCycleCount: Int?
    public var disturbanceCount: Int?
    public var sleepNeeded: Int?
    public var respiratoryRate: String?
    public var sleepPerformancePercentage: String?
    public var sleepConsistencyPercentage: String?
    public var sleepEfficiencyPercentage: String?
    public var createdAt: String?
    public var updatedAt: String?

    public init(
        id: String,
        userId: String,
        start: String
    ) {
        self.id = id
        self.userId = userId
        self.start = start
    }

    // MARK: - Computed Properties

    /// Total sleep time in hours (light + deep + REM)
    public var totalSleepHours: Double? {
        let light = totalLightSleepTime ?? 0
        let deep = totalSlowWaveSleepTime ?? 0
        let rem = totalRemSleepTime ?? 0
        let totalMs = light + deep + rem
        guard totalMs > 0 else { return nil }
        return Double(totalMs) / (1000 * 60 * 60)
    }

    /// Time in bed in hours
    public var inBedHours: Double? {
        guard let ms = totalInBedTime, ms > 0 else { return nil }
        return Double(ms) / (1000 * 60 * 60)
    }

    /// Awake time in hours
    public var awakeHours: Double? {
        guard let ms = totalAwakeTime, ms > 0 else { return nil }
        return Double(ms) / (1000 * 60 * 60)
    }

    /// Light sleep in hours
    public var lightSleepHours: Double? {
        guard let ms = totalLightSleepTime, ms > 0 else { return nil }
        return Double(ms) / (1000 * 60 * 60)
    }

    /// Deep sleep in hours
    public var deepSleepHours: Double? {
        guard let ms = totalSlowWaveSleepTime, ms > 0 else { return nil }
        return Double(ms) / (1000 * 60 * 60)
    }

    /// REM sleep in hours
    public var remSleepHours: Double? {
        guard let ms = totalRemSleepTime, ms > 0 else { return nil }
        return Double(ms) / (1000 * 60 * 60)
    }

    /// Sleep performance as a double (0-100)
    public var performanceValue: Double? {
        guard let perf = sleepPerformancePercentage else { return nil }
        return Double(perf)
    }

    /// Sleep efficiency as a double (0-100)
    public var efficiencyValue: Double? {
        guard let eff = sleepEfficiencyPercentage else { return nil }
        return Double(eff)
    }

    /// Sleep consistency as a double (0-100)
    public var consistencyValue: Double? {
        guard let cons = sleepConsistencyPercentage else { return nil }
        return Double(cons)
    }

    /// Respiratory rate as a double
    public var respiratoryRateValue: Double? {
        guard let rr = respiratoryRate else { return nil }
        return Double(rr)
    }
}

// MARK: - WHOOP Workout

public struct WhoopWorkout: Codable, Identifiable {
    public var id: String
    public var userId: String
    public var start: String
    public var end: String?
    public var sportId: Int?
    public var sportName: String?
    public var scoreState: String?
    public var strain: String?
    public var averageHeartRate: Int?
    public var maxHeartRate: Int?
    public var kilojoule: String?
    public var distanceMeters: String?
    public var altitudeGainMeters: String?
    public var altitudeLossMeters: String?
    public var zoneZeroMs: Int?
    public var zoneOneMs: Int?
    public var zoneTwoMs: Int?
    public var zoneThreeMs: Int?
    public var zoneFourMs: Int?
    public var zoneFiveMs: Int?
    public var createdAt: String?
    public var updatedAt: String?

    public init(
        id: String,
        userId: String,
        start: String
    ) {
        self.id = id
        self.userId = userId
        self.start = start
    }

    public var strainValue: Double? {
        guard let strain = strain else { return nil }
        return Double(strain)
    }

    public var kilojouleValue: Double? {
        guard let kj = kilojoule else { return nil }
        return Double(kj)
    }

    public var caloriesBurned: Double? {
        guard let kj = kilojouleValue else { return nil }
        return kj / 4.184 // Convert kJ to kcal
    }

    public var distanceKm: Double? {
        guard let meters = distanceMeters, let value = Double(meters) else { return nil }
        return value / 1000
    }

    public var distanceMiles: Double? {
        guard let km = distanceKm else { return nil }
        return km * 0.621371
    }

    /// Duration in minutes based on HR zones
    public var durationMinutes: Double? {
        let zones = [zoneZeroMs, zoneOneMs, zoneTwoMs, zoneThreeMs, zoneFourMs, zoneFiveMs]
        let totalMs = zones.compactMap { $0 }.reduce(0, +)
        guard totalMs > 0 else { return nil }
        return Double(totalMs) / (1000 * 60)
    }

    public var startDate: Date? {
        ISO8601DateFormatter().date(from: start)
    }

    public var endDate: Date? {
        guard let end = end else { return nil }
        return ISO8601DateFormatter().date(from: end)
    }
}

// MARK: - API Responses

public struct WhoopProfileResponse: Codable {
    public var connected: Bool
    public var profile: WhoopProfile?

    public init(connected: Bool, profile: WhoopProfile? = nil) {
        self.connected = connected
        self.profile = profile
    }
}

public struct WhoopRecoveryResponse: Codable {
    public var latest: WhoopRecovery?
    public var latestCycle: WhoopCycle?
    public var recoveries: [WhoopRecovery]?

    public init(latest: WhoopRecovery? = nil, latestCycle: WhoopCycle? = nil) {
        self.latest = latest
        self.latestCycle = latestCycle
    }
}

public struct WhoopSleepResponse: Codable {
    public var latest: WhoopSleep?
    public var sleeps: [WhoopSleep]?

    public init(latest: WhoopSleep? = nil, sleeps: [WhoopSleep]? = nil) {
        self.latest = latest
        self.sleeps = sleeps
    }
}

public struct WhoopCyclesResponse: Codable {
    public var cycles: [WhoopCycle]

    public init(cycles: [WhoopCycle]) {
        self.cycles = cycles
    }
}

public struct WhoopWorkoutsResponse: Codable {
    public var workouts: [WhoopWorkout]

    public init(workouts: [WhoopWorkout]) {
        self.workouts = workouts
    }
}

public struct WhoopSyncResponse: Codable {
    public var success: Bool
    public var message: String?
    public var syncedCycles: Int?
    public var syncedRecoveries: Int?
    public var syncedSleeps: Int?
    public var syncedWorkouts: Int?

    public init(success: Bool) {
        self.success = success
    }
}

// MARK: - Formatting Helpers

public enum WhoopFormatter {
    /// Format recovery score with color indicator
    public static func formatRecoveryScore(_ score: Int?) -> String {
        guard let score = score else { return "--" }
        return "\(score)%"
    }

    /// Get color name for recovery score (green/yellow/red)
    public static func recoveryColorName(_ score: Int?) -> String {
        guard let score = score else { return "gray" }
        if score >= 67 { return "green" }
        if score >= 34 { return "yellow" }
        return "red"
    }

    /// Format strain value
    public static func formatStrain(_ strain: Double?) -> String {
        guard let strain = strain else { return "--" }
        return String(format: "%.1f", strain)
    }

    /// Get color name for strain (blue/yellow/orange/red)
    public static func strainColorName(_ strain: Double?) -> String {
        guard let strain = strain else { return "gray" }
        if strain >= 18 { return "red" }
        if strain >= 14 { return "orange" }
        if strain >= 10 { return "yellow" }
        return "blue"
    }

    /// Format HRV in milliseconds
    public static func formatHRV(_ hrv: Double?) -> String {
        guard let hrv = hrv else { return "--" }
        return "\(Int(hrv)) ms"
    }

    /// Format resting heart rate
    public static func formatRestingHR(_ rhr: Double?) -> String {
        guard let rhr = rhr else { return "--" }
        return "\(Int(rhr)) bpm"
    }

    /// Format sleep duration from hours
    public static func formatSleepDuration(_ hours: Double?) -> String {
        guard let hours = hours, hours > 0 else { return "--" }
        let wholeHours = Int(hours)
        let minutes = Int((hours - Double(wholeHours)) * 60)
        return "\(wholeHours)h \(minutes)m"
    }

    /// Format percentage
    public static func formatPercentage(_ value: Double?) -> String {
        guard let value = value else { return "--" }
        return "\(Int(value))%"
    }

    /// Format SpO2
    public static func formatSpO2(_ spo2: Double?) -> String {
        guard let spo2 = spo2 else { return "--" }
        return String(format: "%.1f%%", spo2)
    }

    /// Format temperature in Fahrenheit
    public static func formatTempF(_ celsius: Double?) -> String {
        guard let celsius = celsius else { return "--" }
        let fahrenheit = celsius * 9 / 5 + 32
        return String(format: "%.1f\u{00B0}F", fahrenheit)
    }

    /// Format respiratory rate
    public static func formatRespiratoryRate(_ rate: Double?) -> String {
        guard let rate = rate else { return "--" }
        return String(format: "%.1f /min", rate)
    }
}
