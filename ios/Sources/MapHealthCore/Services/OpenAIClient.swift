import Foundation

public struct OpenAIClient {
    public struct Message: Encodable {
        public let role: String
        public let content: String

        public init(role: String, content: String) {
            self.role = role
            self.content = content
        }
    }

    public struct ChatCompletionRequest: Encodable {
        public let model: String
        public let messages: [Message]
        public let temperature: Double?

        public init(model: String, messages: [Message], temperature: Double? = nil) {
            self.model = model
            self.messages = messages
            self.temperature = temperature
        }
    }

    public struct ChatCompletionResponse: Decodable {
        public struct Choice: Decodable {
            public struct ChoiceMessage: Decodable {
                public let role: String
                public let content: String
            }
            public let message: ChoiceMessage
        }

        public let choices: [Choice]
    }

    public struct APIErrorResponse: Decodable, Error {
        public struct APIError: Decodable {
            public let message: String
            public let type: String?
        }

        public let error: APIError
    }

    public init() {}

    public func sendChat(
        apiKey: String,
        model: String,
        messages: [Message]
    ) async throws -> String {
        guard let url = URL(string: "https://api.openai.com/v1/chat/completions") else {
            throw URLError(.badURL)
        }

        let body = ChatCompletionRequest(model: model, messages: messages)
        let payload = try JSONEncoder().encode(body)

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = payload
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        if (200..<300).contains(httpResponse.statusCode) {
            let decoded = try JSONDecoder().decode(ChatCompletionResponse.self, from: data)
            guard let message = decoded.choices.first?.message.content else {
                throw URLError(.cannotParseResponse)
            }
            return message
        } else {
            if let apiError = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
                throw apiError
            }
            throw URLError(.badServerResponse)
        }
    }
}

extension OpenAIClient.APIErrorResponse: LocalizedError {
    public var errorDescription: String? {
        error.message
    }
}
