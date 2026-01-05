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
                ForEach(LLMModelCatalog.claudeModels) { model in
                    Text(model.name)
                        .tag(model.id)
                }
            }
            .pickerStyle(.wheel)
            .accessibilityIdentifier("claudeModelPicker")
            .padding(16)
            .mapHealthGlassSurface(cornerRadius: 20, tint: Color.accentColor.opacity(0.08))
        } footer: {
            Button("CLAUDE_MODEL_SAVE_ACTION") {
                onContinue()
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
    }
}

#if DEBUG
#Preview {
    ClaudeModelSelection {}
}
#endif
