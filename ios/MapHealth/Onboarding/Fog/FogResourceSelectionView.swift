import MapHealthCore
import SwiftUI

struct FogResourceSelectionView: View {
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "FOG_SELECTION_TITLE",
            subtitle: "FOG_SELECTION_SUBTITLE"
        ) {
            VStack(spacing: 16) {
                Image(systemName: "server.rack")
                    .font(.system(size: 80))
                    .foregroundStyle(.accent)
                    .accessibilityHidden(true)

                Text("FOG_SELECTION_NOTE")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
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
