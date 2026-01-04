import MapHealthCore
import SwiftUI

struct LLMSourceSelection: View {
    @AppStorage(StorageKeys.llmSource) private var llmSourceRaw = StorageKeys.Defaults.llmSource
    let onContinue: (LLMSource) -> Void

    var body: some View {
        OnboardingScreen(
            title: "LLM_SOURCE_SELECTION_TITLE",
            subtitle: "LLM_SOURCE_SELECTION_SUBTITLE"
        ) {
            self.sourceSelector
        } footer: {
            Button("LLM_SOURCE_SELECTION_BUTTON") {
                onContinue(llmSource)
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
    }

    private var sourceSelector: some View {
        Picker("LLM_SOURCE_PICKER_LABEL", selection: $llmSourceRaw) {
            ForEach(LLMSource.chatSources) { source in
                Text(source.localizedDescription)
                    .tag(source.rawValue)
            }
        }
        .pickerStyle(.wheel)
        .frame(maxWidth: .infinity)
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.08))
        .accessibilityIdentifier("llmSourcePicker")
    }

    private var llmSource: LLMSource {
        LLMSource(rawValue: llmSourceRaw) ?? .openai
    }
}

#if DEBUG
#Preview {
    LLMSourceSelection { _ in }
}
#endif
