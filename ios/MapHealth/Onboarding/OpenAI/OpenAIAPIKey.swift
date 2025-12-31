import MapHealthCore
import SpeziLLMOpenAI
import SpeziViews
import SwiftUI

struct OpenAIAPIKey: View {
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath

    var body: some View {
        LLMOpenAIAPITokenOnboardingStep {
            onboardingNavigationPath.append(customView: OpenAIModelSelection())
        }
    }
}

#if DEBUG
#Preview {
    OpenAIAPIKey()
}
#endif
