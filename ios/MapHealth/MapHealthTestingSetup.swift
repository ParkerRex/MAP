import MapHealthCore
import OSLog
import SwiftUI

private struct MapHealthAppTestingSetup: ViewModifier {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false

    let logger = Logger(subsystem: "MapHealth", category: "Testing")

    func body(content: Content) -> some View {
        content
            .task {
                if FeatureFlags.skipOnboarding {
                    completedOnboardingFlow = true
                }
                if FeatureFlags.showOnboarding {
                    completedOnboardingFlow = false
                }
                if FeatureFlags.resetKeychainStorage {
                    do {
                        try KeychainService.shared.deleteOpenAIKey()
                        try KeychainService.shared.deleteSessionToken()
                    } catch {
                        logger.error("Could not clear secure storage: \(error.localizedDescription)")
                    }
                }
            }
    }
}

extension View {
    func testingSetup() -> some View {
        self.modifier(MapHealthAppTestingSetup())
    }
}
