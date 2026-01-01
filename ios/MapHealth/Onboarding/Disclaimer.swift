import MapHealthCore
import SpeziOnboarding
import SpeziViews
import SwiftUI

struct Disclaimer: View {
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath

    var body: some View {
        OnboardingView(
            content: {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        OnboardingTitleView(
                            title: "INTERESTING_MODULES_TITLE",
                            subtitle: "INTERESTING_MODULES_SUBTITLE"
                        )

                        disclaimerItem(
                            title: "INTERESTING_MODULES_AREA1_TITLE".moduleLocalized,
                            description: "INTERESTING_MODULES_AREA1_DESCRIPTION".moduleLocalized
                        )
                        disclaimerItem(
                            title: "INTERESTING_MODULES_AREA2_TITLE".moduleLocalized,
                            description: "INTERESTING_MODULES_AREA2_DESCRIPTION".moduleLocalized
                        )
                        disclaimerItem(
                            title: "INTERESTING_MODULES_AREA3_TITLE".moduleLocalized,
                            description: "INTERESTING_MODULES_AREA3_DESCRIPTION".moduleLocalized
                        )
                        disclaimerItem(
                            title: "INTERESTING_MODULES_AREA4_TITLE".moduleLocalized,
                            description: "INTERESTING_MODULES_AREA4_DESCRIPTION".moduleLocalized
                        )
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
                }
            },
            footer: {
                Button("INTERESTING_MODULES_BUTTON".moduleLocalized) {
                    onboardingNavigationPath.nextStep()
                }
                .buttonStyle(.borderedProminent)
            }
        )
    }

    private func disclaimerItem(title: String, description: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.headline)
            Text(description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}

#if DEBUG
#Preview {
    Disclaimer()
}
#endif
