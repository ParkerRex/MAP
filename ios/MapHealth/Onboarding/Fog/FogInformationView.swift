import MapHealthCore
import SwiftUI

struct FogInformationView: View {
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "FOG_INFO_TITLE",
            subtitle: "FOG_INFO_SUBTITLE"
        ) {
            VStack(spacing: 16) {
                fogFeatureRow(
                    icon: "network.badge.shield.half.filled",
                    title: "FOG_INFO_FEATURE_PRIVATE_TITLE",
                    description: "FOG_INFO_FEATURE_PRIVATE_DESC"
                )
                fogFeatureRow(
                    icon: "server.rack",
                    title: "FOG_INFO_FEATURE_LOCAL_TITLE",
                    description: "FOG_INFO_FEATURE_LOCAL_DESC"
                )
                fogFeatureRow(
                    icon: "exclamationmark.circle.fill",
                    title: "FOG_INFO_FEATURE_SETUP_TITLE",
                    description: "FOG_INFO_FEATURE_SETUP_DESC"
                )
            }
        } footer: {
            Button("FOG_INFO_START_BUTTON") {
                onContinue()
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
    }

    private func fogFeatureRow(icon: String, title: LocalizedStringKey, description: LocalizedStringKey) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(.accent)
                .frame(width: 28, height: 28)

            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.06))
    }
}

#if DEBUG
#Preview {
    FogInformationView {}
}
#endif
