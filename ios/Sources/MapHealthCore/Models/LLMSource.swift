import Foundation

public enum LLMSource: String, CaseIterable, Identifiable, Codable {
    case openai
    case claude
    case fog
    case local

    public var id: String {
        self.rawValue
    }

    public var localizedDescription: LocalizedStringResource {
        switch self {
        case .openai:
            LocalizedStringResource("OPENAI_LLM_LABEL")
        case .claude:
            LocalizedStringResource("CLAUDE_LLM_LABEL")
        case .fog:
            LocalizedStringResource("FOG_LLM_LABEL")
        case .local:
            LocalizedStringResource("LOCAL_LLM_LABEL")
        }
    }

    public static var chatSources: [LLMSource] {
        [.openai, .claude]
    }
}
