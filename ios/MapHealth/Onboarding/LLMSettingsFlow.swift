import SwiftUI

struct LLMSettingsFlow: View {
    @Environment(\.dismiss) private var dismiss
    @State private var path = [OnboardingRoute]()

    var body: some View {
        NavigationStack(path: $path) {
            OpenAIAPIKey {
                path.append(.openAIModel)
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
                case .openAIModel:
                    OpenAIModelSelection {
                        dismiss()
                    }
                default:
                    EmptyView()
                }
            }
        }
    }
}
