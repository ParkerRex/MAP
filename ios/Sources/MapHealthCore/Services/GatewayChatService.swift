import Foundation

public struct GatewayChatResult: Sendable {
    public let sessionId: String
    public let runId: String
    public let text: String
    public let status: String
    public let modelUsed: String?
    public let requiresConfirmation: Bool

    public init(
        sessionId: String,
        runId: String,
        text: String,
        status: String,
        modelUsed: String? = nil,
        requiresConfirmation: Bool = false
    ) {
        self.sessionId = sessionId
        self.runId = runId
        self.text = text
        self.status = status
        self.modelUsed = modelUsed
        self.requiresConfirmation = requiresConfirmation
    }
}

public enum GatewayChatError: LocalizedError {
    case invalidURL
    case malformedEnvelope
    case unauthorized
    case requestFailed(String)
    case timeout
    case disconnected

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid gateway URL."
        case .malformedEnvelope:
            return "Malformed gateway websocket envelope."
        case .unauthorized:
            return "Gateway authentication failed."
        case .requestFailed(let message):
            return message
        case .timeout:
            return "Gateway chat request timed out."
        case .disconnected:
            return "Gateway websocket disconnected."
        }
    }
}

public final class GatewayChatService {
    public static let shared = GatewayChatService()

    private let wsURL: URL
    private let session: URLSession

    public init(baseURL: URL? = nil, session: URLSession = .shared) {
        #if DEBUG
        let defaultBaseURL = URL(string: "https://mapyourlife.org")!
        #else
        let defaultBaseURL = URL(string: "https://app.map.ai")!
        #endif

        let resolvedBaseURL = baseURL ?? defaultBaseURL
        self.wsURL = GatewayChatService.buildWebSocketURL(from: resolvedBaseURL)
        self.session = session
    }

    public func sendMessage(
        prompt: String,
        model: String?,
        sessionId: String?,
        confirmed: Bool = false,
        token: String?,
        timeoutSeconds: TimeInterval = 60
    ) async throws -> GatewayChatResult {
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw GatewayChatError.requestFailed("Prompt is required.")
        }

        var wsURL = self.wsURL
        if let token, !token.isEmpty {
            var components = URLComponents(url: wsURL, resolvingAgainstBaseURL: false)
            var queryItems = components?.queryItems ?? []
            queryItems.append(URLQueryItem(name: "token", value: token))
            components?.queryItems = queryItems
            if let updated = components?.url {
                wsURL = updated
            }
        }

        let task = session.webSocketTask(with: wsURL)
        task.resume()
        defer {
            task.cancel(with: .goingAway, reason: nil)
        }

        let connectRequestId = "connect_\(UUID().uuidString)"
        try await sendRequest(
            task: task,
            id: connectRequestId,
            method: "connect",
            params: [
                "auth": token.map { ["token": $0] } ?? [:],
                "client": ["role": "operator", "name": "map-ios-chat"]
            ]
        )
        _ = try await waitForResponse(task: task, requestId: connectRequestId)

        let sendRequestId = "send_\(UUID().uuidString)"
        var sendParams: [String: Any] = [
            "prompt": prompt,
            "message": prompt,
            "confirmed": confirmed,
            "idempotencyKey": "ios-\(UUID().uuidString)"
        ]
        if let model, !model.isEmpty {
            sendParams["model"] = model
        }
        if let sessionId, !sessionId.isEmpty {
            sendParams["sessionId"] = sessionId
        }

        try await sendRequest(task: task, id: sendRequestId, method: "chat.send", params: sendParams)

        let deadline = Date().addingTimeInterval(timeoutSeconds)
        var resolvedRunId: String?
        var resolvedSessionId = sessionId
        var status = "started"
        var modelUsed: String?
        var requiresConfirmation = false
        var output = ""
        var receivedAck = false
        var finished = false

        while Date() < deadline && (!receivedAck || !finished) {
            let envelope = try await receiveEnvelope(task: task)

            if let type = envelope["type"] as? String, type == "res" {
                let id = envelope["id"] as? String
                if id == sendRequestId {
                    let ok = (envelope["ok"] as? Bool) ?? false
                    if !ok {
                        let message = ((envelope["error"] as? [String: Any])?["message"] as? String) ??
                            "Gateway request failed."
                        throw GatewayChatError.requestFailed(message)
                    }

                    if let payload = envelope["payload"] as? [String: Any] {
                        resolvedRunId = payload["runId"] as? String
                        if let session = payload["sessionId"] as? String {
                            resolvedSessionId = session
                        }
                    }
                    receivedAck = true
                }
                continue
            }

            if let type = envelope["type"] as? String, type == "event",
               let event = envelope["event"] as? String, event == "chat",
               let payload = envelope["payload"] as? [String: Any],
               let kind = payload["kind"] as? String {
                if kind == "run.started" {
                    if let runId = payload["runId"] as? String {
                        resolvedRunId = runId
                    }
                    if let session = payload["sessionId"] as? String {
                        resolvedSessionId = session
                    }
                    continue
                }

                if kind == "delta" {
                    let eventRunId = payload["runId"] as? String
                    if resolvedRunId == nil || eventRunId == resolvedRunId {
                        output += payload["text"] as? String ?? ""
                    }
                    continue
                }

                if kind == "run.finished" {
                    let eventRunId = payload["runId"] as? String
                    if resolvedRunId == nil || eventRunId == resolvedRunId {
                        status = payload["status"] as? String ?? "done"
                        modelUsed = payload["modelUsed"] as? String
                        requiresConfirmation = payload["requiresConfirmation"] as? Bool ?? false
                        finished = true
                    }
                    continue
                }
            }

            if let type = envelope["type"] as? String, type == "event",
               let event = envelope["event"] as? String, event == "chat",
               let payload = envelope["payload"] as? [String: Any],
               let state = payload["state"] as? String {
                let eventRunId = payload["runId"] as? String
                if resolvedRunId == nil || eventRunId == resolvedRunId {
                    switch state {
                    case "delta":
                        if let text = GatewayChatService.extractEventText(payload: payload) {
                            output += text
                        }
                    case "final":
                        if let text = GatewayChatService.extractEventText(payload: payload), !text.isEmpty {
                            output = text
                        }
                        status = "done"
                        finished = true
                    case "aborted":
                        status = "aborted"
                        finished = true
                    case "error":
                        let eventMessage = (payload["errorMessage"] as? String) ?? "Gateway run failed."
                        throw GatewayChatError.requestFailed(eventMessage)
                    default:
                        break
                    }
                }
                continue
            }
        }

        guard receivedAck else {
            throw GatewayChatError.timeout
        }

        guard let runId = resolvedRunId else {
            throw GatewayChatError.malformedEnvelope
        }

        guard let sessionId = resolvedSessionId, !sessionId.isEmpty else {
            throw GatewayChatError.malformedEnvelope
        }

        return GatewayChatResult(
            sessionId: sessionId,
            runId: runId,
            text: output.trimmingCharacters(in: .whitespacesAndNewlines),
            status: status,
            modelUsed: modelUsed,
            requiresConfirmation: requiresConfirmation
        )
    }

    private func waitForResponse(
        task: URLSessionWebSocketTask,
        requestId: String
    ) async throws -> [String: Any] {
        while true {
            let envelope = try await receiveEnvelope(task: task)
            let type = envelope["type"] as? String
            guard type == "res" else {
                continue
            }

            guard let id = envelope["id"] as? String, id == requestId else {
                continue
            }

            let ok = (envelope["ok"] as? Bool) ?? false
            if !ok {
                let code = ((envelope["error"] as? [String: Any])?["code"] as? String) ?? ""
                let message = ((envelope["error"] as? [String: Any])?["message"] as? String) ??
                    "Gateway request failed."
                if code == "unauthorized" {
                    throw GatewayChatError.unauthorized
                }
                throw GatewayChatError.requestFailed(message)
            }
            return envelope
        }
    }

    private func sendRequest(
        task: URLSessionWebSocketTask,
        id: String,
        method: String,
        params: [String: Any]
    ) async throws {
        let envelope: [String: Any] = [
            "type": "req",
            "id": id,
            "method": method,
            "params": params
        ]
        let data = try JSONSerialization.data(withJSONObject: envelope)
        guard let text = String(data: data, encoding: .utf8) else {
            throw GatewayChatError.malformedEnvelope
        }
        try await task.send(.string(text))
    }

    private func receiveEnvelope(task: URLSessionWebSocketTask) async throws -> [String: Any] {
        let message = try await task.receive()
        switch message {
        case .string(let text):
            guard let data = text.data(using: .utf8),
                  let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                throw GatewayChatError.malformedEnvelope
            }
            return json
        case .data(let data):
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                throw GatewayChatError.malformedEnvelope
            }
            return json
        @unknown default:
            throw GatewayChatError.disconnected
        }
    }

    private static func buildWebSocketURL(from baseURL: URL) -> URL {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)
        if components?.scheme == "https" {
            components?.scheme = "wss"
        } else {
            components?.scheme = "ws"
        }
        components?.path = "/v1/ws"
        return components?.url ?? URL(string: "wss://app.map.ai/v1/ws")!
    }

    private static func extractEventText(payload: [String: Any]) -> String? {
        if let direct = payload["text"] as? String, !direct.isEmpty {
            return direct
        }

        guard let message = payload["message"] as? [String: Any] else {
            return nil
        }

        if let content = message["content"] as? String, !content.isEmpty {
            return content
        }

        if let contentArray = message["content"] as? [[String: Any]] {
            let parts = contentArray.compactMap { item -> String? in
                if let text = item["text"] as? String, !text.isEmpty {
                    return text
                }
                if let nested = item["content"] as? String, !nested.isEmpty {
                    return nested
                }
                return nil
            }
            if !parts.isEmpty {
                return parts.joined(separator: "\n")
            }
        }

        return nil
    }
}
