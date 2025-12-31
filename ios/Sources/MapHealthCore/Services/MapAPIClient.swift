import Foundation

/// Client for syncing health data to Map backend
public class MapAPIClient {
    public static let shared = MapAPIClient()

    private let baseURL: URL
    private let session: URLSession
    private var authToken: String?

    public init(baseURL: URL = URL(string: "https://app.map.ai")!) {
        self.baseURL = baseURL
        self.session = URLSession.shared
    }

    // MARK: - Authentication

    public func setAuthToken(_ token: String) {
        self.authToken = token
    }

    public func clearAuthToken() {
        self.authToken = nil
    }

    public var isAuthenticated: Bool {
        authToken != nil
    }

    // MARK: - Health Data Sync

    /// Sync health data to Map backend
    public func syncHealthData(_ healthData: [HealthData]) async throws -> SyncResponse {
        let endpoint = baseURL.appendingPathComponent("/api/health/apple-health/sync")

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let payload = HealthSyncPayload(
            syncedAt: ISO8601DateFormatter().string(from: Date()),
            deviceId: getDeviceId(),
            healthData: healthData
        )

        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw MapAPIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw MapAPIError.httpError(statusCode: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(SyncResponse.self, from: data)
    }

    /// Check if Apple Health is connected for this user
    public func getHealthStatus() async throws -> HealthConnectionStatus {
        let endpoint = baseURL.appendingPathComponent("/api/health/apple-health/status")

        var request = URLRequest(url: endpoint)
        request.httpMethod = "GET"

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw MapAPIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw MapAPIError.httpError(statusCode: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(HealthConnectionStatus.self, from: data)
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

// MARK: - Response Types

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
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .unauthorized:
            return "Not authorized. Please sign in."
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}
