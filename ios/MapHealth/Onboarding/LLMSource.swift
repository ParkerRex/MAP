


import Foundation
import Foundation


enum LLMSource: String, CaseIterable, Identifiable, Codable {
    case openai
    case fog
    case local

    var id: String {
        self.rawValue
    }
    
    var localizedDescription: LocalizedStringResource {
        switch self {
        case .openai:
            LocalizedStringResource("OPENAI_LLM_LABEL")
        case .fog:
            LocalizedStringResource("FOG_LLM_LABEL")
        case .local:
            LocalizedStringResource("LOCAL_LLM_LABEL")
        }
    }
}
