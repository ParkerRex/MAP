import MapHealthCore
import SwiftUI

struct OpenAIModelSelection: View {
    @AppStorage(StorageKeys.openAIModel) private var openAIModel = StorageKeys.Defaults.openAIModel
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "MODEL_SELECTION_TITLE",
            subtitle: "MODEL_SELECTION_SUBTITLE"
        ) {
            Picker("MODEL_SELECTION_TITLE", selection: $openAIModel) {
                ForEach(LLMModelCatalog.openAIModels) { model in
                    Text(model.name)
                        .tag(model.id)
                }
            }
            .pickerStyle(.wheel)
            .accessibilityIdentifier("modelPicker")
            .padding(16)
            .mapHealthGlassSurface(cornerRadius: 20, tint: Color.accentColor.opacity(0.08))
        } footer: {
            Button("OPEN_AI_MODEL_SAVE_ACTION") {
                onContinue()
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
    }
}
