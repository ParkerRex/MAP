import Foundation

@MainActor
public final class HealthDataInterpreter: ObservableObject {
    @Published public var messages: [ChatMessage] = []
    @Published public private(set) var isGenerating = false

    private let healthDataFetcher: HealthDataFetcher
    private let openAIClient: OpenAIClient
    private let claudeClient: ClaudeAPIClient
    private var systemPrompt = ""
    private var llmSource: LLMSource = .openai
    private var openAIModel = StorageKeys.Defaults.openAIModel
    private var claudeModel = StorageKeys.Defaults.claudeModel

    public init(
        healthDataFetcher: HealthDataFetcher = HealthDataFetcher(),
        openAIClient: OpenAIClient = OpenAIClient(),
        claudeClient: ClaudeAPIClient = ClaudeAPIClient()
    ) {
        self.healthDataFetcher = healthDataFetcher
        self.openAIClient = openAIClient
        self.claudeClient = claudeClient
    }

    public func prepareSession(
        source: LLMSource,
        openAIModel: String,
        claudeModel: String
    ) async {
        self.llmSource = source
        self.openAIModel = openAIModel
        self.claudeModel = claudeModel
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

        isGenerating = true
        defer { isGenerating = false }

        if FeatureFlags.mockMode {
            messages.append(ChatMessage(role: .assistant, content: String(localized: "LLM_MOCK_RESPONSE")))
            return
        }

        switch llmSource {
        case .openai:
            guard let apiKey = KeychainService.shared.getOpenAIKey() else {
                throw OpenAIClientError.missingAPIKey
            }
            let openAIMessages = buildOpenAIMessages()
            let response = try await openAIClient.sendChat(
                apiKey: apiKey,
                model: openAIModel,
                messages: openAIMessages
            )
            messages.append(ChatMessage(role: .assistant, content: response))
        case .claude:
            let response = try await sendClaudeMessage()
            messages.append(ChatMessage(role: .assistant, content: response))
        case .fog, .local:
            throw LLMError.unsupportedSource
        }
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

    private func buildClaudeMessages() -> [ClaudeChatMessage] {
        messages.compactMap { message in
            switch message.role {
            case .user, .assistant:
                return ClaudeChatMessage(role: message.role.rawValue, content: message.content)
            case .system:
                return nil
            }
        }
    }

    private func sendClaudeMessage() async throws -> String {
        do {
            let response = try await claudeClient.sendMessage(
                messages: buildClaudeMessages(),
                systemPrompt: systemPrompt,
                model: claudeModel
            )
            return response.text
        } catch ClaudeAPIError.unauthorized {
            if let handler = MapAPIClient.shared.onAuthenticationRequired {
                let success = await handler()
                if success {
                    let response = try await claudeClient.sendMessage(
                        messages: buildClaudeMessages(),
                        systemPrompt: systemPrompt,
                        model: claudeModel
                    )
                    return response.text
                }
            }
            throw ClaudeAPIError.unauthorized
        }
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

public enum LLMError: LocalizedError {
    case unsupportedSource

    public var errorDescription: String? {
        switch self {
        case .unsupportedSource:
            return "Unsupported LLM source"
        }
    }
}
