import AuthenticationServices
import Foundation

/// Client for syncing health data to Map backend
public class MapAPIClient {
    public static let shared = MapAPIClient()

    private let baseURLString: String
    private let session: URLSession
    private var authToken: String?

    /// Callback for when re-authentication is needed (401 response)
    public var onAuthenticationRequired: (() async -> Bool)?

    public init(baseURL: String? = nil) {
        #if DEBUG
        self.baseURLString = baseURL ?? "https://mapyourlife.org"
        #else
        self.baseURLString = baseURL ?? "https://app.map.ai"
        #endif
        self.session = URLSession.shared

        // Load token from Keychain on init
        if let storedToken = KeychainService.shared.getSessionToken() {
            self.authToken = storedToken
        }
    }

    // MARK: - Authentication

    public func setAuthToken(_ token: String) {
        self.authToken = token
    }

    public func clearAuthToken() {
        self.authToken = nil
        try? KeychainService.shared.deleteSessionToken()
    }

    public var isAuthenticated: Bool {
        authToken != nil
    }

    /// Sign out - clears token but preserves local cached data
    public func signOut() {
        clearAuthToken()
    }

    // MARK: - User Profile

    /// Get the current user's profile
    public func getProfile() async throws -> UserProfile {
        return try await request(
            endpoint: "/api/auth/me",
            method: "GET",
            responseType: ProfileResponse.self
        ).user
    }

    // MARK: - Claude API Key

    public func setClaudeApiKey(_ apiKey: String) async throws {
        struct ClaudeKeyPayload: Codable {
            let apiKey: String
        }

        _ = try await request(
            endpoint: "/api/claude/key",
            method: "POST",
            body: ClaudeKeyPayload(apiKey: apiKey),
            responseType: EmptyResponse.self
        )
    }

    // MARK: - Tasks

    /// Get all tasks for the current user
    public func getTasks() async throws -> [MapTask] {
        return try await request(
            endpoint: "/api/tasks",
            method: "GET",
            responseType: TasksResponse.self
        ).tasks
    }

    /// Create a new task
    public func createTask(_ request: CreateTaskRequest) async throws -> MapTask {
        return try await self.request(
            endpoint: "/api/tasks",
            method: "POST",
            body: request,
            responseType: TaskResponse.self
        ).task
    }

    /// Update an existing task
    public func updateTask(id: String, _ request: UpdateTaskRequest) async throws -> MapTask {
        return try await self.request(
            endpoint: "/api/tasks/\(id)",
            method: "PUT",
            body: request,
            responseType: TaskResponse.self
        ).task
    }

    /// Toggle task completion status
    public func toggleTask(id: String, completed: Bool) async throws -> MapTask {
        let request = UpdateTaskRequest(completed: completed)
        return try await updateTask(id: id, request)
    }

    /// Delete a task
    public func deleteTask(id: String) async throws {
        _ = try await request(
            endpoint: "/api/tasks/\(id)",
            method: "DELETE",
            responseType: SuccessResponse.self
        )
    }

    /// Get all tags for the current user
    public func getTags() async throws -> [TaskTag] {
        return try await request(
            endpoint: "/api/tags",
            method: "GET",
            responseType: TagsResponse.self
        ).tags
    }

    /// Get a single tag
    public func getTag(id: String) async throws -> TaskTag {
        return try await request(
            endpoint: "/api/tags/\(id)",
            method: "GET",
            responseType: TagResponse.self
        ).tag
    }

    /// Create a new tag
    public func createTag(_ request: CreateTagRequest) async throws -> TaskTag {
        return try await self.request(
            endpoint: "/api/tags",
            method: "POST",
            body: request,
            responseType: TagResponse.self
        ).tag
    }

    /// Update an existing tag
    public func updateTag(id: String, _ request: UpdateTagRequest) async throws -> TaskTag {
        return try await self.request(
            endpoint: "/api/tags/\(id)",
            method: "PUT",
            body: request,
            responseType: TagResponse.self
        ).tag
    }

    /// Delete a tag
    public func deleteTag(id: String) async throws {
        _ = try await request(
            endpoint: "/api/tags/\(id)",
            method: "DELETE",
            responseType: SuccessResponse.self
        )
    }

    // MARK: - Notes

    /// Get all notes for the current user
    public func getNotes() async throws -> [MapNote] {
        return try await request(
            endpoint: "/api/notes",
            method: "GET",
            responseType: NotesResponse.self
        ).notes
    }

    /// Create a new note
    public func createNote(_ request: CreateNoteRequest) async throws -> MapNote {
        return try await self.request(
            endpoint: "/api/notes",
            method: "POST",
            body: request,
            responseType: NoteResponse.self
        ).note
    }

    /// Update an existing note
    public func updateNote(id: String, _ request: UpdateNoteRequest) async throws -> MapNote {
        return try await self.request(
            endpoint: "/api/notes/\(id)",
            method: "PUT",
            body: request,
            responseType: NoteResponse.self
        ).note
    }

    /// Delete a note
    public func deleteNote(id: String) async throws {
        _ = try await request(
            endpoint: "/api/notes/\(id)",
            method: "DELETE",
            responseType: SuccessResponse.self
        )
    }

    /// Get all folders for the current user
    public func getFolders() async throws -> [MapFolder] {
        return try await request(
            endpoint: "/api/folders",
            method: "GET",
            responseType: FoldersResponse.self
        ).folders
    }

    /// Create a new folder
    public func createFolder(name: String) async throws -> MapFolder {
        return try await request(
            endpoint: "/api/folders",
            method: "POST",
            body: CreateFolderRequest(name: name),
            responseType: FolderResponse.self
        ).folder
    }

    /// Update an existing folder
    public func updateFolder(id: String, name: String) async throws -> MapFolder {
        return try await request(
            endpoint: "/api/folders/\(id)",
            method: "PUT",
            body: UpdateFolderRequest(name: name),
            responseType: FolderResponse.self
        ).folder
    }

    /// Delete a folder
    public func deleteFolder(id: String) async throws {
        _ = try await request(
            endpoint: "/api/folders/\(id)",
            method: "DELETE",
            responseType: SuccessResponse.self
        )
    }

    // MARK: - Health Data Sync

    /// Sync health data to Map backend
    public func syncHealthData(_ healthData: [HealthData]) async throws -> SyncResponse {
        let payload = HealthSyncPayload(
            syncedAt: ISO8601DateFormatter().string(from: Date()),
            deviceId: getDeviceId(),
            healthData: healthData
        )

        return try await request(
            endpoint: "/api/health/apple-health/sync",
            method: "POST",
            body: payload,
            responseType: SyncResponse.self
        )
    }

    /// Check if Apple Health is connected for this user
    public func getHealthStatus() async throws -> HealthConnectionStatus {
        return try await request(
            endpoint: "/api/health/apple-health/status",
            method: "GET",
            responseType: HealthConnectionStatus.self
        )
    }

    // MARK: - Calendar

    /// Get user's calendars
    public func getCalendars(refresh: Bool = false) async throws -> [CalendarInfo] {
        let endpoint = refresh ? "/api/calendar/calendars?refresh=true" : "/api/calendar/calendars"
        return try await request(
            endpoint: endpoint,
            method: "GET",
            responseType: CalendarsResponse.self
        ).calendars
    }

    /// Get events for a date range
    public func getEvents(
        calendarId: String = "primary",
        timeMin: Date,
        timeMax: Date,
        timeZone: String? = nil,
        query: String? = nil,
        maxResults: Int? = nil
    ) async throws -> EventsResponse {
        var endpoint = "/api/calendar/events?calendarId=\(calendarId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? calendarId)"
        endpoint += "&timeMin=\(timeMin.iso8601String)"
        endpoint += "&timeMax=\(timeMax.iso8601String)"
        if let tz = timeZone {
            endpoint += "&timeZone=\(tz)"
        }
        if let q = query, !q.isEmpty {
            endpoint += "&q=\(q.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? q)"
        }
        if let max = maxResults {
            endpoint += "&maxResults=\(max)"
        }

        return try await request(
            endpoint: endpoint,
            method: "GET",
            responseType: EventsResponse.self
        )
    }

    /// Get events from multiple calendars
    public func getMultiCalendarEvents(
        calendarIds: [String],
        timeMin: Date,
        timeMax: Date,
        timeZone: String? = nil
    ) async throws -> [CalendarEvent] {
        var allEvents: [CalendarEvent] = []

        // Fetch events from all calendars concurrently
        try await withThrowingTaskGroup(of: EventsResponse.self) { group in
            for calendarId in calendarIds {
                group.addTask {
                    try await self.getEvents(
                        calendarId: calendarId,
                        timeMin: timeMin,
                        timeMax: timeMax,
                        timeZone: timeZone
                    )
                }
            }

            for try await response in group {
                allEvents.append(contentsOf: response.events)
            }
        }

        // Sort by start time
        return allEvents.sorted { event1, event2 in
            guard let date1 = event1.startDate, let date2 = event2.startDate else {
                return false
            }
            return date1 < date2
        }
    }

    /// Get a single event by ID
    public func getEvent(eventId: String, calendarId: String = "primary") async throws -> CalendarEvent {
        let encodedEventId = eventId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? eventId
        let encodedCalendarId = calendarId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? calendarId
        let endpoint = "/api/calendar/events/\(encodedEventId)?calendarId=\(encodedCalendarId)"

        return try await request(
            endpoint: endpoint,
            method: "GET",
            responseType: EventResponse.self
        ).event
    }

    /// Create a new calendar event
    public func createEvent(
        _ eventRequest: CreateEventRequest,
        calendarId: String = "primary",
        sendUpdates: String? = nil,
        addConference: Bool = false
    ) async throws -> CalendarEvent {
        let encodedCalendarId = calendarId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? calendarId
        var endpoint = "/api/calendar/events?calendarId=\(encodedCalendarId)"

        if let updates = sendUpdates {
            endpoint += "&sendUpdates=\(updates)"
        }
        if addConference {
            endpoint += "&conferenceDataVersion=1"
        }

        return try await request(
            endpoint: endpoint,
            method: "POST",
            body: eventRequest,
            responseType: EventResponse.self
        ).event
    }

    /// Update an existing calendar event
    public func updateEvent(
        eventId: String,
        _ eventRequest: UpdateEventRequest,
        calendarId: String = "primary",
        sendUpdates: String? = nil
    ) async throws -> CalendarEvent {
        let encodedEventId = eventId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? eventId
        let encodedCalendarId = calendarId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? calendarId
        var endpoint = "/api/calendar/events/\(encodedEventId)?calendarId=\(encodedCalendarId)"

        if let updates = sendUpdates {
            endpoint += "&sendUpdates=\(updates)"
        }

        return try await request(
            endpoint: endpoint,
            method: "PUT",
            body: eventRequest,
            responseType: EventResponse.self
        ).event
    }

    /// Delete a calendar event
    public func deleteEvent(
        eventId: String,
        calendarId: String = "primary",
        sendUpdates: String? = nil
    ) async throws {
        let encodedEventId = eventId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? eventId
        let encodedCalendarId = calendarId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? calendarId
        var endpoint = "/api/calendar/events/\(encodedEventId)?calendarId=\(encodedCalendarId)"

        if let updates = sendUpdates {
            endpoint += "&sendUpdates=\(updates)"
        }

        _ = try await request(
            endpoint: endpoint,
            method: "DELETE",
            responseType: DeleteEventResponse.self
        )
    }

    /// Get calendar color palette
    public func getColors() async throws -> CalendarColors {
        return try await request(
            endpoint: "/api/calendar/colors",
            method: "GET",
            responseType: ColorsResponse.self
        ).colors
    }

    /// Sync calendars with Google
    public func syncCalendars(forceFullSync: Bool = false) async throws -> SyncCalendarsResponse {
        let endpoint = forceFullSync ? "/api/calendar/sync?forceFullSync=true" : "/api/calendar/sync"
        return try await request(
            endpoint: endpoint,
            method: "POST",
            responseType: SyncCalendarsResponse.self
        )
    }

    // MARK: - WHOOP Integration

    /// Get WHOOP profile and connection status
    public func getWhoopProfile() async throws -> WhoopProfileResponse {
        return try await request(
            endpoint: "/api/whoop/profile",
            method: "GET",
            responseType: WhoopProfileResponse.self
        )
    }

    /// Get latest WHOOP recovery data
    public func getWhoopRecovery() async throws -> WhoopRecoveryResponse {
        return try await request(
            endpoint: "/api/whoop/recovery",
            method: "GET",
            responseType: WhoopRecoveryResponse.self
        )
    }

    /// Get latest WHOOP sleep data
    public func getWhoopSleep() async throws -> WhoopSleepResponse {
        return try await request(
            endpoint: "/api/whoop/sleep",
            method: "GET",
            responseType: WhoopSleepResponse.self
        )
    }

    /// Get WHOOP cycles with optional date range
    public func getWhoopCycles(startDate: String? = nil, endDate: String? = nil, limit: Int? = nil) async throws -> WhoopCyclesResponse {
        var endpoint = "/api/whoop/cycles"
        var params: [String] = []

        if let start = startDate {
            params.append("startDate=\(start)")
        }
        if let end = endDate {
            params.append("endDate=\(end)")
        }
        if let limit = limit {
            params.append("limit=\(limit)")
        }

        if !params.isEmpty {
            endpoint += "?" + params.joined(separator: "&")
        }

        return try await request(
            endpoint: endpoint,
            method: "GET",
            responseType: WhoopCyclesResponse.self
        )
    }

    /// Get WHOOP workouts with optional date range
    public func getWhoopWorkouts(startDate: String? = nil, endDate: String? = nil, limit: Int? = nil) async throws -> WhoopWorkoutsResponse {
        var endpoint = "/api/whoop/workouts"
        var params: [String] = []

        if let start = startDate {
            params.append("startDate=\(start)")
        }
        if let end = endDate {
            params.append("endDate=\(end)")
        }
        if let limit = limit {
            params.append("limit=\(limit)")
        }

        if !params.isEmpty {
            endpoint += "?" + params.joined(separator: "&")
        }

        return try await request(
            endpoint: endpoint,
            method: "GET",
            responseType: WhoopWorkoutsResponse.self
        )
    }

    /// Sync WHOOP data (triggers 30-day sync)
    public func syncWhoop() async throws -> WhoopSyncResponse {
        return try await request(
            endpoint: "/api/whoop/sync",
            method: "POST",
            responseType: WhoopSyncResponse.self
        )
    }

    /// Disconnect WHOOP integration
    public func disconnectWhoop() async throws {
        _ = try await request(
            endpoint: "/api/whoop/disconnect",
            method: "POST",
            responseType: SuccessResponse.self
        )
    }

    // MARK: - Generic Request Handler

    private func request<T: Decodable, B: Encodable>(
        endpoint: String,
        method: String,
        body: B? = nil as Empty?,
        responseType: T.Type,
        retryOnUnauthorized: Bool = true
    ) async throws -> T {
        guard let url = URL(string: baseURLString + endpoint) else {
            throw MapAPIError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw MapAPIError.invalidResponse
        }

        // Handle 401 Unauthorized - attempt inline re-auth
        if httpResponse.statusCode == 401 && retryOnUnauthorized {
            // Attempt re-authentication
            if let onAuthRequired = onAuthenticationRequired {
                let success = await onAuthRequired()
                if success {
                    // Retry the request with new token
                    return try await self.request(
                        endpoint: endpoint,
                        method: method,
                        body: body,
                        responseType: responseType,
                        retryOnUnauthorized: false // Don't retry again
                    )
                }
            }
            throw MapAPIError.unauthorized
        }

        guard httpResponse.statusCode == 200 else {
            throw MapAPIError.httpError(statusCode: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    // Overload for requests without body
    private func request<T: Decodable>(
        endpoint: String,
        method: String,
        responseType: T.Type,
        retryOnUnauthorized: Bool = true
    ) async throws -> T {
        return try await request(
            endpoint: endpoint,
            method: method,
            body: nil as Empty?,
            responseType: responseType,
            retryOnUnauthorized: retryOnUnauthorized
        )
    }

    // MARK: - Helpers

    private func getDeviceId() -> String {
        // Use a persistent device identifier
        if let existingId = UserDefaults.standard.string(forKey: "map.deviceId") {
            return existingId
        }

        let newId = UUID().uuidString
        UserDefaults.standard.set(newId, forKey: "map.deviceId")
        return newId
    }
}

// MARK: - Empty type for requests without body

private struct Empty: Encodable {}

private struct EmptyResponse: Codable {}

public struct SuccessResponse: Codable {
    public let success: Bool

    public init(success: Bool) {
        self.success = success
    }
}

// MARK: - Response Types

public struct UserProfile: Codable {
    public var id: String
    public var email: String
    public var displayName: String?
    public var firstName: String?
    public var lastName: String?
    public var profilePhotoUrl: String?

    public init(
        id: String,
        email: String,
        displayName: String? = nil,
        firstName: String? = nil,
        lastName: String? = nil,
        profilePhotoUrl: String? = nil
    ) {
        self.id = id
        self.email = email
        self.displayName = displayName
        self.firstName = firstName
        self.lastName = lastName
        self.profilePhotoUrl = profilePhotoUrl
    }
}

private struct ProfileResponse: Codable {
    var user: UserProfile
}

public struct SyncResponse: Codable {
    public var success: Bool
    public var message: String?
    public var recordsProcessed: Int?

    public init(success: Bool, message: String? = nil, recordsProcessed: Int? = nil) {
        self.success = success
        self.message = message
        self.recordsProcessed = recordsProcessed
    }
}

public struct HealthConnectionStatus: Codable {
    public var connected: Bool
    public var lastSyncAt: String?
    public var deviceName: String?

    public init(connected: Bool, lastSyncAt: String? = nil, deviceName: String? = nil) {
        self.connected = connected
        self.lastSyncAt = lastSyncAt
        self.deviceName = deviceName
    }
}

// MARK: - Errors

public enum MapAPIError: Error, LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)
    case unauthorized
    case networkError(Error)

    public var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return String(localized: "API_INVALID_RESPONSE")
        case .httpError(let statusCode):
            return String(format: String(localized: "API_HTTP_ERROR"), statusCode)
        case .unauthorized:
            return String(localized: "API_UNAUTHORIZED")
        case .networkError(let error):
            return String(format: String(localized: "API_NETWORK_ERROR"), error.localizedDescription)
        }
    }
}
