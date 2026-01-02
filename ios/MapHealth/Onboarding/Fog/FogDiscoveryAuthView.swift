import MapHealthCore
import SwiftUI

struct FogDiscoveryAuthView: View {
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "FOG_DISCOVERY_TITLE",
            subtitle: "FOG_DISCOVERY_SUBTITLE"
        ) {
            VStack(spacing: 16) {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .font(.system(size: 80))
                    .foregroundStyle(.accent)
                    .accessibilityHidden(true)

                Text("FOG_DISCOVERY_NOTE")
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
