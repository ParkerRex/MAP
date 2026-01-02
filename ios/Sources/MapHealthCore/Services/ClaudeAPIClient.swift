import Foundation

/// Client for Claude AI chat through the Map web backend
public class ClaudeAPIClient {
    public static let shared = ClaudeAPIClient()

    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL = URL(string: "https://app.map.ai")!) {
        self.baseURL = baseURL
        self.session = URLSession.shared
    }

    // MARK: - Claude Status

    /// Check if Claude is connected for the current user
    public func getClaudeStatus() async throws -> ClaudeStatusResponse {
        let endpoint = baseURL.appendingPathComponent("/api/claude/status")

        var request = URLRequest(url: endpoint)
        request.httpMethod = "GET"

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ClaudeAPIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            if httpResponse.statusCode == 401 {
                throw ClaudeAPIError.unauthorized
            }
            throw ClaudeAPIError.httpError(statusCode: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(ClaudeStatusResponse.self, from: data)
    }

    // MARK: - Chat

    /// Send a message to Claude (non-streaming)
    public func sendMessage(
        messages: [ClaudeChatMessage],
        systemPrompt: String?,
        model: String = "claude-sonnet-4-20250514",
        maxTokens: Int = 4096
    ) async throws -> ClaudeChatResponse {
        let endpoint = baseURL.appendingPathComponent("/api/claude/chat")

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ClaudeChatRequest(
            messages: messages,
            model: model,
            system: systemPrompt,
            max_tokens: maxTokens,
            stream: false
        )

        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ClaudeAPIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            if httpResponse.statusCode == 401 {
                throw ClaudeAPIError.unauthorized
            }
            if httpResponse.statusCode == 400 {
                throw ClaudeAPIError.notConnected
            }
            throw ClaudeAPIError.httpError(statusCode: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(ClaudeChatResponse.self, from: data)
    }

    /// Stream a message from Claude
    public func streamMessage(
        messages: [ClaudeChatMessage],
        systemPrompt: String?,
        model: String = "claude-sonnet-4-20250514",
        maxTokens: Int = 4096
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let endpoint = baseURL.appendingPathComponent("/api/claude/chat")

                    var request = URLRequest(url: endpoint)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

                    let body = ClaudeChatRequest(
                        messages: messages,
                        model: model,
                        system: systemPrompt,
                        max_tokens: maxTokens,
                        stream: true
                    )

                    request.httpBody = try JSONEncoder().encode(body)

                    let (bytes, response) = try await session.bytes(for: request)

                    guard let httpResponse = response as? HTTPURLResponse else {
                        throw ClaudeAPIError.invalidResponse
                    }

                    guard httpResponse.statusCode == 200 else {
                        if httpResponse.statusCode == 401 {
                            throw ClaudeAPIError.unauthorized
                        }
                        if httpResponse.statusCode == 400 {
                            throw ClaudeAPIError.notConnected
                        }
                        throw ClaudeAPIError.httpError(statusCode: httpResponse.statusCode)
                    }

                    for try await line in bytes.lines {
                        if line.hasPrefix("data: ") {
                            let data = String(line.dropFirst(6))
                            if data == "[DONE]" {
                                break
                            }

                            if let jsonData = data.data(using: .utf8),
                               let event = try? JSONDecoder().decode(ClaudeStreamEvent.self, from: jsonData) {
                                if let delta = event.delta, delta.type == "text_delta" {
                                    continuation.yield(delta.text ?? "")
                                }
                            }
                        }
                    }

                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Disconnect

    /// Disconnect Claude integration
    public func disconnect() async throws -> Bool {
        let endpoint = baseURL.appendingPathComponent("/api/claude/disconnect")

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ClaudeAPIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw ClaudeAPIError.httpError(statusCode: httpResponse.statusCode)
        }

        let result = try JSONDecoder().decode(DisconnectResponse.self, from: data)
        return result.success
    }
}

// MARK: - Request Types

public struct ClaudeChatMessage: Codable {
    public var role: String  // "user" or "assistant"
    public var content: String

    public init(role: String, content: String) {
        self.role = role
        self.content = content
    }
}

public struct ClaudeChatRequest: Codable {
    public var messages: [ClaudeChatMessage]
    public var model: String?
    public var system: String?
    public var max_tokens: Int?
    public var stream: Bool?

    public init(
        messages: [ClaudeChatMessage],
        model: String? = nil,
        system: String? = nil,
        max_tokens: Int? = nil,
        stream: Bool? = nil
    ) {
        self.messages = messages
        self.model = model
        self.system = system
        self.max_tokens = max_tokens
        self.stream = stream
    }
}

// MARK: - Response Types

public struct ClaudeStatusResponse: Codable {
    public var connected: Bool
    public var expiresAt: String?

    public init(connected: Bool, expiresAt: String? = nil) {
        self.connected = connected
        self.expiresAt = expiresAt
    }
}

public struct ClaudeContentBlock: Codable {
    public var type: String
    public var text: String

    public init(type: String, text: String) {
        self.type = type
        self.text = text
    }
}

public struct ClaudeChatResponse: Codable {
    public var id: String
    public var type: String
    public var role: String
    public var content: [ClaudeContentBlock]
    public var model: String
    public var stop_reason: String?
    public var usage: ClaudeUsage?

    public init(
        id: String,
        type: String,
        role: String,
        content: [ClaudeContentBlock],
        model: String,
        stop_reason: String? = nil,
        usage: ClaudeUsage? = nil
    ) {
        self.id = id
        self.type = type
        self.role = role
        self.content = content
        self.model = model
        self.stop_reason = stop_reason
        self.usage = usage
    }

    /// Helper to get the text content as a single string
    public var text: String {
        content.map { $0.text }.joined()
    }
}

public struct ClaudeUsage: Codable {
    public var input_tokens: Int
    public var output_tokens: Int

    public init(input_tokens: Int, output_tokens: Int) {
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
    }
}

public struct ClaudeStreamEvent: Codable {
    public var type: String
    public var delta: ClaudeStreamDelta?
    public var error: ClaudeStreamError?

    public init(type: String, delta: ClaudeStreamDelta? = nil, error: ClaudeStreamError? = nil) {
        self.type = type
        self.delta = delta
        self.error = error
    }
}

public struct ClaudeStreamDelta: Codable {
    public var type: String?
    public var text: String?

    public init(type: String? = nil, text: String? = nil) {
        self.type = type
        self.text = text
    }
}

public struct ClaudeStreamError: Codable {
    public var type: String?
    public var message: String?

    public init(type: String? = nil, message: String? = nil) {
        self.type = type
        self.message = message
    }
}

public struct DisconnectResponse: Codable {
    public var success: Bool

    public init(success: Bool) {
        self.success = success
    }
}

// MARK: - Errors

public enum ClaudeAPIError: Error, LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)
    case unauthorized
    case notConnected
    case networkError(Error)

    public var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return String(localized: "API_INVALID_RESPONSE")
        case .httpError(let statusCode):
            return String(format: String(localized: "API_HTTP_ERROR"), statusCode)
        case .unauthorized:
            return String(localized: "API_UNAUTHORIZED")
        case .notConnected:
            return String(localized: "CLAUDE_NOT_CONNECTED_ERROR")
        case .networkError(let error):
            return String(format: String(localized: "API_NETWORK_ERROR"), error.localizedDescription)
        }
    }
}
