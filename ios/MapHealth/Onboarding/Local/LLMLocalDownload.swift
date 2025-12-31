import MapHealthCore
import SpeziLLMLocalDownload
import SpeziViews
import SwiftUI

struct LLMLocalDownload: View {
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath

    var body: some View {
        LLMLocalDownloadView(
            model: .llama3_2_3B_4bit,
            downloadDescription: "LLAMA3_DOWNLOAD_DESCRIPTION"
        ) {
            onboardingNavigationPath.nextStep()
        }
    }
}

#if DEBUG
#Preview {
    LLMLocalDownload()
}
#endif
