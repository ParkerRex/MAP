import Foundation

@MainActor
public final class HealthDataInterpreter: ObservableObject {
    @Published public var messages: [ChatMessage] = []
    @Published public private(set) var isGenerating = false

    private let healthDataFetcher: HealthDataFetcher
    private let openAIClient: OpenAIClient
    private var systemPrompt = ""
    private var model: String = "gpt-4o"

    public init(
        healthDataFetcher: HealthDataFetcher = HealthDataFetcher(),
        openAIClient: OpenAIClient = OpenAIClient()
    ) {
        self.healthDataFetcher = healthDataFetcher
        self.openAIClient = openAIClient
    }

    public func prepareSession(model: String) async {
        self.model = model
        self.systemPrompt = await generateSystemPrompt()
        self.messages = []
    }

    public func appendUserMessage(_ content: String) {
        messages.append(ChatMessage(role: .user, content: content))
    }

    public func queryLLM() async throws {
        guard !isGenerating, messages.last?.role == .user else {
            return
        }

        guard let apiKey = KeychainService.shared.getOpenAIKey() else {
            throw OpenAIClientError.missingAPIKey
        }

        isGenerating = true
        defer { isGenerating = false }

        if FeatureFlags.mockMode {
            messages.append(ChatMessage(role: .assistant, content: String(localized: "LLM_MOCK_RESPONSE")))
            return
        }

        let openAIMessages = buildOpenAIMessages()
        let response = try await openAIClient.sendChat(
            apiKey: apiKey,
            model: model,
            messages: openAIMessages
        )
        messages.append(ChatMessage(role: .assistant, content: response))
    }

    public func resetChat() async {
        systemPrompt = await generateSystemPrompt()
        messages = []
    }

    private func buildOpenAIMessages() -> [OpenAIClient.Message] {
        var result = [OpenAIClient.Message(role: "system", content: systemPrompt)]
        result.append(contentsOf: messages.map { message in
            OpenAIClient.Message(role: message.role.rawValue, content: message.content)
        })
        return result
    }

    private func generateSystemPrompt() async -> String {
        let healthData = await healthDataFetcher.fetchAndProcessHealthData()
        return PromptGenerator(with: healthData).buildMainPrompt()
    }
}

public enum OpenAIClientError: LocalizedError {
    case missingAPIKey

    public var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return String(localized: "OPENAI_MISSING_API_KEY")
        }
    }
}
