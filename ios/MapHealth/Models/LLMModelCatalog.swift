import Foundation
import MapHealthCore

struct LLMModelOption: Identifiable, Hashable {
    let id: String
    let name: String
}

enum LLMModelCatalog {
    static let openAIModels: [LLMModelOption] = [
        LLMModelOption(id: "gpt-5.2", name: "GPT-5.2"),
        LLMModelOption(id: "gpt-5-mini", name: "GPT-5 mini"),
        LLMModelOption(id: "gpt-5-nano", name: "GPT-5 nano")
    ]

    static let claudeModels: [LLMModelOption] = [
        LLMModelOption(id: "claude-opus-4-1-20250805", name: "Opus 4.1 (Most Capable)"),
        LLMModelOption(id: "claude-sonnet-4-20250514", name: "Sonnet 4 (Balanced)"),
        LLMModelOption(id: "claude-3-7-sonnet-20250219", name: "Sonnet 3.7 (Reasoning)"),
        LLMModelOption(id: "claude-3-5-haiku-20241022", name: "Haiku 3.5 (Fast & Cheap)")
    ]

    static func models(for source: LLMSource, currentModelId: String? = nil) -> [LLMModelOption] {
        let baseModels: [LLMModelOption]
        switch source {
        case .openai:
            baseModels = openAIModels
        case .claude:
            baseModels = claudeModels
        case .fog, .local:
            baseModels = openAIModels
        }

        guard let currentModelId, !baseModels.contains(where: { $0.id == currentModelId }) else {
            return baseModels
        }

        return [LLMModelOption(id: currentModelId, name: currentModelId)] + baseModels
    }

    static func displayName(for modelId: String, source: LLMSource) -> String {
        models(for: source, currentModelId: modelId)
            .first { $0.id == modelId }?
            .name ?? modelId
    }
}
