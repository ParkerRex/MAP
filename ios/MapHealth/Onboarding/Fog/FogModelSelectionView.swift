import MapHealthCore
import SwiftUI

struct FogModelSelectionView: View {
    @State private var fogModel = Self.models.first ?? "llama3"
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "FOG_MODEL_TITLE",
            subtitle: "FOG_MODEL_SUBTITLE"
        ) {
            Picker("FOG_MODEL_PICKER_LABEL", selection: $fogModel) {
                ForEach(Self.models, id: \.self) { model in
                    Text(verbatim: model)
                        .tag(model)
                }
            }
            .pickerStyle(.wheel)
            .padding(16)
            .mapHealthGlassSurface(cornerRadius: 20, tint: Color.accentColor.opacity(0.08))
        } footer: {
            Button("FOG_MODEL_SAVE_ACTION") {
                onContinue()
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
    }

    private static let models: [String] = [
        "llama3",
        "phi",
        "gemma"
    ]
}
