import Foundation

/// Service for Convex-based AI chat with streaming support
@MainActor
public final class ConvexChatService: ObservableObject {
    public static let shared = ConvexChatService()

    @Published public private(set) var threads: [ConvexChatThread] = []
    @Published public private(set) var currentMessages: [ConvexChatMessage] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var streamingContent = ""
    @Published public private(set) var error: Error?

    private let convexClient: ConvexClient
    private var chatStreamURL: URL {
        #if DEBUG
        return URL(string: "https://mapyourlife.org/chat/stream")!
        #else
        return URL(string: "https://app.map.ai/chat/stream")!
        #endif
    }

    public init(convexClient: ConvexClient = .shared) {
        self.convexClient = convexClient
    }

    // MARK: - Thread Management

    /// Fetch all chat threads
    public func fetchThreads() async {
        isLoading = true
        error = nil

        do {
            threads = try await convexClient.listChatThreads()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    /// Create a new chat thread
    public func createThread(title: String? = nil) async -> ConvexChatThread? {
        isLoading = true
        error = nil

        do {
            let thread = try await convexClient.createChatThread(title: title)
            threads.insert(thread, at: 0)
            isLoading = false
            return thread
        } catch {
            self.error = error
            isLoading = false
            return nil
        }
    }

    /// Load messages for a thread
    public func loadMessages(threadId: String) async {
        isLoading = true
        error = nil

        do {
            currentMessages = try await convexClient.listChatMessages(threadId: threadId)
        } catch {
            self.error = error
        }

        isLoading = false
    }

    // MARK: - Chat with Streaming

    /// Send a message and stream the response
    public func sendMessage(
        threadId: String,
        prompt: String,
        onChunk: ((String) -> Void)? = nil
    ) async -> Bool {
        isLoading = true
        error = nil
        streamingContent = ""

        do {
            // Create the chat run via Convex
            let run = try await convexClient.createChatRun(threadId: threadId, prompt: prompt)

            // Stream the response via HTTP endpoint
            try await streamResponse(streamId: run.streamId, onChunk: onChunk)

            // Refresh messages after streaming completes
            await loadMessages(threadId: threadId)

            isLoading = false
            return true
        } catch {
            self.error = error
            isLoading = false
            return false
        }
    }

    /// Stream response from the chat endpoint
    private func streamResponse(streamId: String, onChunk: ((String) -> Void)?) async throws {
        var request = URLRequest(url: chatStreamURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add auth token
        if let token = KeychainService.shared.getSessionToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Set the stream ID in the body
        let body: [String: Any] = ["streamId": streamId]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (bytes, response) = try await URLSession.shared.bytes(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ConvexChatError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw ConvexChatError.httpError(statusCode: httpResponse.statusCode)
        }

        // Process Server-Sent Events
        for try await line in bytes.lines {
            if line.hasPrefix("data: ") {
                let data = String(line.dropFirst(6))

                if data == "[DONE]" {
                    break
                }

                if let jsonData = data.data(using: .utf8) {
                    do {
                        if let event = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                            // Handle different event types
                            if let eventType = event["type"] as? String {
                                switch eventType {
                                case "text":
                                    if let text = event["text"] as? String {
                                        await MainActor.run {
                                            streamingContent += text
                                            onChunk?(text)
                                        }
                                    }
                                case "error":
                                    if let errorMessage = event["error"] as? String {
                                        throw ConvexChatError.streamError(errorMessage)
                                    }
                                default:
                                    break
                                }
                            }
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }
        }
    }

    // MARK: - Polling for Run Status

    /// Poll for chat run completion (alternative to streaming)
    public func waitForRunCompletion(runId: String, pollInterval: TimeInterval = 0.5, timeout: TimeInterval = 120) async throws -> ConvexChatRun {
        let startTime = Date()

        while Date().timeIntervalSince(startTime) < timeout {
            if let run = try await convexClient.getChatRun(runId: runId) {
                if run.isComplete {
                    return run
                }
            }

            try await Task.sleep(nanoseconds: UInt64(pollInterval * 1_000_000_000))
        }

        throw ConvexChatError.timeout
    }

    // MARK: - Helpers

    /// Clear current thread state
    public func clearCurrentThread() {
        currentMessages = []
        streamingContent = ""
        error = nil
    }
}

// MARK: - Errors

public enum ConvexChatError: Error, LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)
    case streamError(String)
    case timeout
    case unauthorized

    public var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from chat server"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .streamError(let message):
            return "Stream error: \(message)"
        case .timeout:
            return "Request timed out"
        case .unauthorized:
            return "Authentication required"
        }
    }
}
