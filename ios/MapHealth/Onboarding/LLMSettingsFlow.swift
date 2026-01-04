import SwiftUI

struct LLMSettingsFlow: View {
    @Environment(\.dismiss) private var dismiss
    @State private var path = [OnboardingRoute]()

    var body: some View {
        NavigationStack(path: $path) {
            LLMSourceSelection { source in
                switch source {
                case .openai:
                    path.append(.openAIKey)
                case .claude:
                    path.append(.claudeAuth)
                case .fog, .local:
                    path.append(.openAIKey)
                }
            }
            .navigationTitle("LLM_SETTINGS_TITLE")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("SETTINGS_DONE") {
                        dismiss()
                    }
                    .mapHealthGlassButtonStyle()
                }
            }
            .navigationDestination(for: OnboardingRoute.self) { route in
                switch route {
                case .openAIKey:
                    OpenAIAPIKey {
                        path.append(.openAIModel)
                    }
                case .openAIModel:
                    OpenAIModelSelection {
                        dismiss()
                    }
                case .claudeAuth:
                    ClaudeAuthView {
                        path.append(.claudeModel)
                    }
                case .claudeModel:
                    ClaudeModelSelection {
                        dismiss()
                    }
                default:
                    EmptyView()
                }
            }
        }
    }
}
