import MapHealthCore
import SpeziLLMFog
import SpeziViews
import SwiftUI

struct FogResourceSelectionView: View {
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath

    var body: some View {
        // Allow an "empty selection", meaning fog nodes are discovered dynamically
        // and requests routed based on available nodes.
        LLMFogDiscoverySelectionView(
            allowingEmptySelection: { _ in
                self.onboardingNavigationPath.append(
                    customView: FogModelSelectionView()
                )
            }
        )
    }
}

