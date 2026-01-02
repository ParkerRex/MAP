import MapHealthCore
import SwiftUI

struct ClaudeModelSelection: View {
    @AppStorage(StorageKeys.claudeModel) private var claudeModel = StorageKeys.Defaults.claudeModel
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "CLAUDE_MODEL_SELECTION_TITLE",
            subtitle: "CLAUDE_MODEL_SELECTION_SUBTITLE"
        ) {
            Picker("CLAUDE_MODEL_SELECTION_TITLE", selection: $claudeModel) {
                ForEach(Self.models, id: \.id) { model in
                    Text(verbatim: model.name)
                        .tag(model.id)
                }
            }
            .pickerStyle(.wheel)
            .accessibilityIdentifier("claudeModelPicker")
            .padding(16)
            .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.08))
        } footer: {
            Button("CLAUDE_MODEL_SAVE_ACTION") {
                onContinue()
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
    }

    private static let models: [ClaudeModel] = [
        ClaudeModel(id: "claude-opus-4-20250514", name: "Opus (Most Capable)"),
        ClaudeModel(id: "claude-sonnet-4-20250514", name: "Sonnet (Balanced)"),
        ClaudeModel(id: "claude-3-5-haiku-20241022", name: "Haiku (Fast & Cheap)")
    ]
}

private struct ClaudeModel: Identifiable {
    let id: String
    let name: String
}

#if DEBUG
#Preview {
    ClaudeModelSelection {}
}
#endif
