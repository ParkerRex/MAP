import AuthenticationServices
import Foundation

/// Client for syncing health data to Map backend
public class MapAPIClient {
    public static let shared = MapAPIClient()

    private let baseURL: URL
    private let session: URLSession
    private var authToken: String?

    /// Callback for when re-authentication is needed (401 response)
    public var onAuthenticationRequired: (() async -> Bool)?

    public init(baseURL: URL = URL(string: "https://app.map.ai")!) {
        self.baseURL = baseURL
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
        timeZone: String? = nil
    ) async throws -> EventsResponse {
        var endpoint = "/api/calendar/events?calendarId=\(calendarId)"
        endpoint += "&timeMin=\(timeMin.iso8601String)"
        endpoint += "&timeMax=\(timeMax.iso8601String)"
        if let tz = timeZone {
            endpoint += "&timeZone=\(tz)"
        }

        return try await request(
            endpoint: endpoint,
            method: "GET",
            responseType: EventsResponse.self
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
        let url = baseURL.appendingPathComponent(endpoint)

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

private struct SuccessResponse: Codable {
    let success: Bool
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
