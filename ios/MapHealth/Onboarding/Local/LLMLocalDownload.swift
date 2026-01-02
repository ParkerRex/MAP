import Foundation
import MapHealthCore
import SwiftUI

struct LLMLocalDownload: View {
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "LOCAL_DOWNLOAD_TITLE",
            subtitle: "LOCAL_DOWNLOAD_SUBTITLE"
        ) {
            VStack(spacing: 16) {
                Image(systemName: "shippingbox")
                    .font(.system(size: 80))
                    .foregroundStyle(.accent)
                    .accessibilityHidden(true)

                Text("LLAMA3_DOWNLOAD_DESCRIPTION")
                    .multilineTextAlignment(.center)
                Text("LOCAL_DOWNLOAD_UNSUPPORTED")
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
            .padding(20)
            .mapHealthGlassSurface(cornerRadius: 24, tint: .accentColor.opacity(0.08))
        } footer: {
            Button("ONBOARDING_CONTINUE") {
                onContinue()
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
    }
}

#if DEBUG
#Preview {
    LLMLocalDownload {}
}
#endif
