


import SpeziOnboarding
import SpeziOnboarding
import SpeziViews
import SwiftUI


struct Disclaimer: View {
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath
    
    
    var body: some View {
        SequentialOnboardingView(
            title: "INTERESTING_MODULES_TITLE".moduleLocalized,
            subtitle: "INTERESTING_MODULES_SUBTITLE".moduleLocalized,
            steps: [
                .init(
                    title: "INTERESTING_MODULES_AREA1_TITLE".moduleLocalized,
                    description: "INTERESTING_MODULES_AREA1_DESCRIPTION".moduleLocalized
                ),
                .init(
                    title: "INTERESTING_MODULES_AREA2_TITLE".moduleLocalized,
                    description: "INTERESTING_MODULES_AREA2_DESCRIPTION".moduleLocalized
                ),
                .init(
                    title: "INTERESTING_MODULES_AREA3_TITLE".moduleLocalized,
                    description: "INTERESTING_MODULES_AREA3_DESCRIPTION".moduleLocalized
                ),
                .init(
                    title: "INTERESTING_MODULES_AREA4_TITLE".moduleLocalized,
                    description: "INTERESTING_MODULES_AREA4_DESCRIPTION".moduleLocalized
                )
            ],
            actionText: "INTERESTING_MODULES_BUTTON".moduleLocalized,
            action: {
                onboardingNavigationPath.nextStep()
            }
        )
    }
}


#if DEBUG
#Preview {
    Disclaimer()
}
#endif
