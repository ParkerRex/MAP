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
                ForEach(Self.models, id: \.self) { model in
                    Text(verbatim: model)
                        .tag(model)
                }
            }
            .pickerStyle(.wheel)
            .accessibilityIdentifier("modelPicker")
            .padding(16)
            .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.08))
        } footer: {
            Button("OPEN_AI_MODEL_SAVE_ACTION") {
                onContinue()
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
    }

    private static let models: [String] = [
        "gpt-4o",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo"
    ]
}
