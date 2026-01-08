import Convex
import Foundation

/// Convex client for real-time data operations
@MainActor
public final class ConvexClient: ObservableObject {
    public static let shared = ConvexClient()

    private var client: ConvexClientProtocol?
    private let keychain: KeychainService

    /// Current authentication state
    @Published public private(set) var isAuthenticated = false

    /// Convex deployment URL - configure via environment or config
    private var deploymentURL: String {
        #if DEBUG
        return ProcessInfo.processInfo.environment["CONVEX_URL"]
            ?? "https://map-dev.convex.cloud"
        #else
        return "https://map.convex.cloud"
        #endif
    }

    public init(keychain: KeychainService = .shared) {
        self.keychain = keychain
    }

    // MARK: - Connection Management

    /// Configure and connect to Convex
    public func configure(token: String? = nil) async throws {
        let convexClient = ConvexClient(deploymentURL: deploymentURL)

        if let token = token ?? keychain.getSessionToken() {
            try await convexClient.setAuth(token: token)
            isAuthenticated = true
        }

        self.client = convexClient
    }

    /// Set authentication token
    public func setAuthToken(_ token: String) async throws {
        guard let client = client else {
            throw ConvexError.notConfigured
        }
        try await client.setAuth(token: token)
        isAuthenticated = true
    }

    /// Clear authentication
    public func clearAuth() async {
        await client?.clearAuth()
        isAuthenticated = false
    }

    // MARK: - Tasks

    /// List all tasks for the current user
    public func listTasks(status: String? = nil) async throws -> [ConvexTask] {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = [:]
        if let status = status {
            args["status"] = .string(status)
        }

        let result = try await client.query("tasks:list", args: args)
        return try decodeArray(result)
    }

    /// Create a new task
    public func createTask(title: String, body: String? = nil, dueAt: Date? = nil) async throws -> ConvexTask {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = ["title": .string(title)]
        if let body = body {
            args["body"] = .string(body)
        }
        if let dueAt = dueAt {
            args["dueAt"] = .float64(dueAt.timeIntervalSince1970 * 1000)
        }

        let result = try await client.mutation("tasks:create", args: args)
        return try decode(result)
    }

    /// Update a task
    public func updateTask(id: String, title: String? = nil, body: String? = nil, status: String? = nil, dueAt: Date? = nil) async throws -> ConvexTask? {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = ["taskId": .id("tasks", id)]
        if let title = title {
            args["title"] = .string(title)
        }
        if let body = body {
            args["body"] = .string(body)
        }
        if let status = status {
            args["status"] = .string(status)
        }
        if let dueAt = dueAt {
            args["dueAt"] = .float64(dueAt.timeIntervalSince1970 * 1000)
        }

        let result = try await client.mutation("tasks:update", args: args)
        return try decodeOptional(result)
    }

    /// Toggle task completion
    public func toggleTask(id: String) async throws -> ConvexTask? {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["taskId": .id("tasks", id)]
        let result = try await client.mutation("tasks:toggle", args: args)
        return try decodeOptional(result)
    }

    /// Delete a task (soft delete)
    public func deleteTask(id: String) async throws {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["taskId": .id("tasks", id)]
        _ = try await client.mutation("tasks:remove", args: args)
    }

    // MARK: - Notes

    /// List all notes for the current user
    public func listNotes(search: String? = nil, folderId: String? = nil) async throws -> [ConvexNote] {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = [:]
        if let search = search {
            args["search"] = .string(search)
        }
        if let folderId = folderId {
            args["folderId"] = .id("folders", folderId)
        }

        let result = try await client.query("notes:list", args: args)
        return try decodeArray(result)
    }

    /// Create a new note
    public func createNote(title: String, content: String, folderId: String? = nil) async throws -> ConvexNote {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = [
            "title": .string(title),
            "content": .string(content),
        ]
        if let folderId = folderId {
            args["folderId"] = .id("folders", folderId)
        }

        let result = try await client.mutation("notes:create", args: args)
        return try decode(result)
    }

    /// Update a note
    public func updateNote(id: String, title: String? = nil, content: String? = nil, folderId: String? = nil) async throws -> ConvexNote? {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = ["noteId": .id("notes", id)]
        if let title = title {
            args["title"] = .string(title)
        }
        if let content = content {
            args["content"] = .string(content)
        }
        if let folderId = folderId {
            args["folderId"] = .id("folders", folderId)
        }

        let result = try await client.mutation("notes:update", args: args)
        return try decodeOptional(result)
    }

    /// Delete a note (soft delete)
    public func deleteNote(id: String) async throws {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["noteId": .id("notes", id)]
        _ = try await client.mutation("notes:remove", args: args)
    }

    // MARK: - Goals

    /// List all goals for the current user
    public func listGoals(status: String? = nil, category: String? = nil) async throws -> [ConvexGoal] {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = [:]
        if let status = status {
            args["status"] = .string(status)
        }
        if let category = category {
            args["category"] = .string(category)
        }

        let result = try await client.query("goals:list", args: args)
        return try decodeArray(result)
    }

    /// Create a new goal
    public func createGoal(title: String, category: String, dueAt: Date? = nil) async throws -> ConvexGoal {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = [
            "title": .string(title),
            "category": .string(category),
        ]
        if let dueAt = dueAt {
            args["dueAt"] = .float64(dueAt.timeIntervalSince1970 * 1000)
        }

        let result = try await client.mutation("goals:create", args: args)
        return try decode(result)
    }

    /// Toggle goal completion
    public func toggleGoal(id: String) async throws -> ConvexGoal? {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["goalId": .id("goals", id)]
        let result = try await client.mutation("goals:toggle", args: args)
        return try decodeOptional(result)
    }

    // MARK: - Calendar

    /// List calendar events in a date range
    public func listCalendarEvents(from: Date, to: Date) async throws -> [ConvexCalendarEvent] {
        guard let client = client else { throw ConvexError.notConfigured }

        let formatter = ISO8601DateFormatter()
        let args: [String: ConvexValue] = [
            "from": .string(formatter.string(from: from)),
            "to": .string(formatter.string(from: to)),
        ]

        let result = try await client.query("calendar:listEvents", args: args)
        return try decodeArray(result)
    }

    /// Create a calendar event
    public func createCalendarEvent(
        summary: String,
        startTime: Date,
        endTime: Date,
        description: String? = nil,
        isAllDay: Bool = false
    ) async throws -> ConvexCalendarEvent {
        guard let client = client else { throw ConvexError.notConfigured }

        let formatter = ISO8601DateFormatter()
        var args: [String: ConvexValue] = [
            "summary": .string(summary),
            "startTime": .string(formatter.string(from: startTime)),
            "endTime": .string(formatter.string(from: endTime)),
            "isAllDay": .bool(isAllDay),
        ]
        if let description = description {
            args["description"] = .string(description)
        }

        let result = try await client.mutation("calendar:createEvent", args: args)
        return try decode(result)
    }

    // MARK: - Health Data (Apple Health)

    /// Get recent health data
    public func listHealthData(days: Int = 7) async throws -> [ConvexHealthData] {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["days": .int64(Int64(days))]
        let result = try await client.query("health:listRecent", args: args)
        return try decodeArray(result)
    }

    /// Upsert health data for a date
    public func upsertHealthData(_ data: ConvexHealthData) async throws -> String {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = ["date": .string(data.date)]

        if let steps = data.steps { args["steps"] = .int64(Int64(steps)) }
        if let activeEnergy = data.activeEnergy { args["activeEnergy"] = .float64(activeEnergy) }
        if let basalEnergy = data.basalEnergy { args["basalEnergy"] = .float64(basalEnergy) }
        if let exerciseMinutes = data.exerciseMinutes { args["exerciseMinutes"] = .int64(Int64(exerciseMinutes)) }
        if let standMinutes = data.standMinutes { args["standMinutes"] = .int64(Int64(standMinutes)) }
        if let distanceMiles = data.distanceMiles { args["distanceMiles"] = .float64(distanceMiles) }
        if let flightsClimbed = data.flightsClimbed { args["flightsClimbed"] = .int64(Int64(flightsClimbed)) }
        if let restingHeartRate = data.restingHeartRate { args["restingHeartRate"] = .int64(Int64(restingHeartRate)) }
        if let hrvSDNN = data.hrvSDNN { args["hrvSDNN"] = .float64(hrvSDNN) }
        if let sleepHours = data.sleepHours { args["sleepHours"] = .float64(sleepHours) }

        let result = try await client.mutation("health:upsert", args: args)
        guard case .id(_, let id) = result else {
            throw ConvexError.invalidResponse
        }
        return id
    }

    // MARK: - Chat

    /// List chat threads
    public func listChatThreads() async throws -> [ConvexChatThread] {
        guard let client = client else { throw ConvexError.notConfigured }

        let result = try await client.query("chat:listThreads", args: [:])
        return try decodeArray(result)
    }

    /// Create a new chat thread
    public func createChatThread(title: String? = nil) async throws -> ConvexChatThread {
        guard let client = client else { throw ConvexError.notConfigured }

        var args: [String: ConvexValue] = [:]
        if let title = title {
            args["title"] = .string(title)
        }

        let result = try await client.mutation("chat:createThread", args: args)
        return try decode(result)
    }

    /// Get messages for a thread
    public func listChatMessages(threadId: String) async throws -> [ConvexChatMessage] {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["threadId": .id("chatThreads", threadId)]
        let result = try await client.query("chat:listMessages", args: args)
        return try decodeArray(result)
    }

    /// Create a chat run (send message and get streaming response)
    public func createChatRun(threadId: String, prompt: String) async throws -> ConvexChatRun {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = [
            "threadId": .id("chatThreads", threadId),
            "prompt": .string(prompt),
        ]

        let result = try await client.mutation("chat:createRun", args: args)
        return try decode(result)
    }

    /// Get chat run status
    public func getChatRun(runId: String) async throws -> ConvexChatRun? {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["runId": .id("chatRuns", runId)]
        let result = try await client.query("chat:getRun", args: args)
        return try decodeOptional(result)
    }

    // MARK: - WHOOP Data

    /// Get WHOOP profile
    public func getWhoopProfile() async throws -> ConvexWhoopProfile? {
        guard let client = client else { throw ConvexError.notConfigured }

        let result = try await client.query("whoop:getProfile", args: [:])
        return try decodeOptional(result)
    }

    /// Get recent WHOOP recovery data
    public func listWhoopRecovery(limit: Int = 7) async throws -> [ConvexWhoopRecovery] {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["limit": .int64(Int64(limit))]
        let result = try await client.query("whoop:listRecovery", args: args)
        return try decodeArray(result)
    }

    /// Get recent WHOOP sleep data
    public func listWhoopSleep(limit: Int = 7) async throws -> [ConvexWhoopSleep] {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["limit": .int64(Int64(limit))]
        let result = try await client.query("whoop:listSleep", args: args)
        return try decodeArray(result)
    }

    /// Get recent WHOOP workouts
    public func listWhoopWorkouts(limit: Int = 14) async throws -> [ConvexWhoopWorkout] {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["limit": .int64(Int64(limit))]
        let result = try await client.query("whoop:listWorkouts", args: args)
        return try decodeArray(result)
    }

    // MARK: - Integrations

    /// Check if an integration is connected
    public func isIntegrationConnected(provider: String) async throws -> Bool {
        guard let client = client else { throw ConvexError.notConfigured }

        let args: [String: ConvexValue] = ["provider": .string(provider)]
        let result = try await client.query("integrations:isConnected", args: args)

        guard case .object(let obj) = result,
              case .bool(let connected) = obj["connected"] else {
            return false
        }
        return connected
    }

    // MARK: - Subscriptions

    /// Subscribe to task updates
    public func subscribeTasks(status: String? = nil, onUpdate: @escaping ([ConvexTask]) -> Void) -> ConvexSubscription {
        guard let client = client else {
            fatalError("ConvexClient not configured")
        }

        var args: [String: ConvexValue] = [:]
        if let status = status {
            args["status"] = .string(status)
        }

        return client.subscribe("tasks:list", args: args) { result in
            if case .success(let value) = result {
                if let tasks: [ConvexTask] = try? self.decodeArray(value) {
                    onUpdate(tasks)
                }
            }
        }
    }

    /// Subscribe to note updates
    public func subscribeNotes(onUpdate: @escaping ([ConvexNote]) -> Void) -> ConvexSubscription {
        guard let client = client else {
            fatalError("ConvexClient not configured")
        }

        return client.subscribe("notes:list", args: [:]) { result in
            if case .success(let value) = result {
                if let notes: [ConvexNote] = try? self.decodeArray(value) {
                    onUpdate(notes)
                }
            }
        }
    }

    /// Subscribe to chat thread updates
    public func subscribeChatThreads(onUpdate: @escaping ([ConvexChatThread]) -> Void) -> ConvexSubscription {
        guard let client = client else {
            fatalError("ConvexClient not configured")
        }

        return client.subscribe("chat:listThreads", args: [:]) { result in
            if case .success(let value) = result {
                if let threads: [ConvexChatThread] = try? self.decodeArray(value) {
                    onUpdate(threads)
                }
            }
        }
    }

    // MARK: - Helpers

    private func decode<T: Decodable>(_ value: ConvexValue) throws -> T {
        let data = try JSONEncoder().encode(value)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func decodeOptional<T: Decodable>(_ value: ConvexValue) throws -> T? {
        if case .null = value { return nil }
        return try decode(value)
    }

    private func decodeArray<T: Decodable>(_ value: ConvexValue) throws -> [T] {
        guard case .array(let array) = value else {
            throw ConvexError.invalidResponse
        }
        return try array.map { try decode($0) }
    }
}

// MARK: - Errors

public enum ConvexError: Error, LocalizedError {
    case notConfigured
    case invalidResponse
    case authenticationRequired

    public var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "Convex client not configured"
        case .invalidResponse:
            return "Invalid response from Convex"
        case .authenticationRequired:
            return "Authentication required"
        }
    }
}

// MARK: - Convex Data Models

public struct ConvexTask: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let title: String
    public let body: String?
    public let status: String
    public let dueAt: Double?
    public let completedAt: Double?
    public let createdAt: Double
    public let updatedAt: Double

    public var id: String { _id }

    public var dueDate: Date? {
        dueAt.map { Date(timeIntervalSince1970: $0 / 1000) }
    }

    public var completedDate: Date? {
        completedAt.map { Date(timeIntervalSince1970: $0 / 1000) }
    }

    public var isCompleted: Bool {
        status == "completed"
    }
}

public struct ConvexNote: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let folderId: String?
    public let title: String
    public let content: String
    public let createdAt: Double
    public let updatedAt: Double?

    public var id: String { _id }
}

public struct ConvexGoal: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let title: String
    public let category: String
    public let status: String
    public let dueAt: Double?
    public let completedAt: Double?
    public let createdAt: Double
    public let updatedAt: Double?

    public var id: String { _id }

    public var isCompleted: Bool {
        status == "completed"
    }
}

public struct ConvexCalendarEvent: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let calendarId: String
    public let externalId: String
    public let summary: String?
    public let description: String?
    public let location: String?
    public let startTime: String
    public let endTime: String
    public let isAllDay: Bool?
    public let status: String?
    public let createdAt: Double
    public let updatedAt: Double?

    public var id: String { _id }
}

public struct ConvexHealthData: Codable, Identifiable {
    public let _id: String?
    public let userId: String?
    public let date: String
    public let steps: Int?
    public let activeEnergy: Double?
    public let basalEnergy: Double?
    public let exerciseMinutes: Int?
    public let standMinutes: Int?
    public let distanceMiles: Double?
    public let flightsClimbed: Int?
    public let restingHeartRate: Int?
    public let hrvSDNN: Double?
    public let walkingHeartRate: Int?
    public let vo2Max: Double?
    public let oxygenSaturation: Double?
    public let respiratoryRate: Double?
    public let bodyWeight: Double?
    public let bodyFatPercentage: Double?
    public let leanBodyMass: Double?
    public let sleepHours: Double?
    public let sleepAwakeHours: Double?
    public let sleepRemHours: Double?
    public let sleepCoreHours: Double?
    public let sleepDeepHours: Double?
    public let sleepInBedHours: Double?

    public var id: String { _id ?? date }

    public init(
        _id: String? = nil,
        userId: String? = nil,
        date: String,
        steps: Int? = nil,
        activeEnergy: Double? = nil,
        basalEnergy: Double? = nil,
        exerciseMinutes: Int? = nil,
        standMinutes: Int? = nil,
        distanceMiles: Double? = nil,
        flightsClimbed: Int? = nil,
        restingHeartRate: Int? = nil,
        hrvSDNN: Double? = nil,
        walkingHeartRate: Int? = nil,
        vo2Max: Double? = nil,
        oxygenSaturation: Double? = nil,
        respiratoryRate: Double? = nil,
        bodyWeight: Double? = nil,
        bodyFatPercentage: Double? = nil,
        leanBodyMass: Double? = nil,
        sleepHours: Double? = nil,
        sleepAwakeHours: Double? = nil,
        sleepRemHours: Double? = nil,
        sleepCoreHours: Double? = nil,
        sleepDeepHours: Double? = nil,
        sleepInBedHours: Double? = nil
    ) {
        self._id = _id
        self.userId = userId
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
        self.sleepAwakeHours = sleepAwakeHours
        self.sleepRemHours = sleepRemHours
        self.sleepCoreHours = sleepCoreHours
        self.sleepDeepHours = sleepDeepHours
        self.sleepInBedHours = sleepInBedHours
    }
}

public struct ConvexChatThread: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let title: String?
    public let createdAt: Double
    public let updatedAt: Double?
    public let lastMessageAt: Double?

    public var id: String { _id }
}

public struct ConvexChatMessage: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let threadId: String
    public let role: String
    public let content: String
    public let status: String
    public let createdAt: Double

    public var id: String { _id }
}

public struct ConvexChatRun: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let threadId: String
    public let streamId: String
    public let prompt: String
    public let status: String
    public let error: String?
    public let createdAt: Double

    public var id: String { _id }

    public var isComplete: Bool {
        status == "done" || status == "error"
    }

    public var isStreaming: Bool {
        status == "streaming"
    }
}

public struct ConvexWhoopProfile: Codable {
    public let _id: String
    public let userId: String
    public let whoopUserId: String
    public let email: String?
    public let firstName: String?
    public let lastName: String?
    public let heightMeter: String?
    public let weightKilogram: String?
    public let maxHeartRate: Int?
    public let lastSyncedAt: Double?
}

public struct ConvexWhoopRecovery: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let cycleId: String
    public let sleepId: String?
    public let whoopUserId: String
    public let scoreState: String
    public let recoveryScore: Int?
    public let restingHeartRate: String?
    public let hrvRmssd: String?
    public let spo2Percentage: String?
    public let skinTempCelsius: String?
    public let createdAt: Double

    public var id: String { _id }
}

public struct ConvexWhoopSleep: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let whoopUserId: String
    public let start: Double
    public let end: Double?
    public let isNap: Bool?
    public let scoreState: String
    public let totalInBedTime: Int?
    public let totalAwakeTime: Int?
    public let totalLightSleepTime: Int?
    public let totalSlowWaveSleepTime: Int?
    public let totalRemSleepTime: Int?
    public let sleepPerformancePercentage: String?
    public let sleepEfficiencyPercentage: String?
    public let createdAt: Double

    public var id: String { _id }

    public var startDate: Date {
        Date(timeIntervalSince1970: start / 1000)
    }

    public var endDate: Date? {
        end.map { Date(timeIntervalSince1970: $0 / 1000) }
    }
}

public struct ConvexWhoopWorkout: Codable, Identifiable {
    public let _id: String
    public let userId: String
    public let whoopUserId: String
    public let start: Double
    public let end: Double?
    public let sportId: Int?
    public let sportName: String?
    public let scoreState: String
    public let strain: String?
    public let averageHeartRate: Int?
    public let maxHeartRate: Int?
    public let kilojoule: String?
    public let distanceMeters: String?
    public let createdAt: Double

    public var id: String { _id }

    public var startDate: Date {
        Date(timeIntervalSince1970: start / 1000)
    }

    public var endDate: Date? {
        end.map { Date(timeIntervalSince1970: $0 / 1000) }
    }
}
