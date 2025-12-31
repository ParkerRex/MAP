import MapHealthCore
import SpeziLLMFog
import SpeziViews
import SwiftUI

struct FogDiscoveryAuthView: View {
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath

    var body: some View {
        LLMFogDiscoveryAuthorizationView {
            self.onboardingNavigationPath.append(
                customView: FogResourceSelectionView()
            )
        }
    }
}
