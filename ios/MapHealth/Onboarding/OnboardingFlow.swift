import HealthKit
import MapHealthCore
import SpeziLLMOpenAI
import SpeziViews
import SwiftUI

/// Displays a multi-step onboarding flow for Map Health.
///
/// Flow:
/// 1. Welcome - Introduction to the app
/// 2. Google Sign-In - Authenticate with Google (required)
/// 3. Disclaimer - Health data warnings (condensed)
/// 4. LLM Source Selection - Choose AI provider (Claude triggers OAuth inline)
/// 5. HealthKit Permissions - Required for health data access
struct OnboardingFlow: View {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @AppStorage(StorageKeys.llmSource) var llmSource = StorageKeys.Defaults.llmSource

    var body: some View {
        // If user already has a session token, skip straight to main app
        if KeychainService.shared.hasSessionToken {
            MainAppView()
        } else {
            ManagedNavigationStack(didComplete: $completedOnboardingFlow) {
                Welcome()
                GoogleSignInView()
                Disclaimer()

                // Presents the onboarding flow for the respective local, fog, or cloud LLM
                LLMSourceSelection()

                if HKHealthStore.isHealthDataAvailable() {
                    HealthKitPermissions()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .interactiveDismissDisabled(!completedOnboardingFlow)
        }
    }
}

/// Placeholder for main app view - integrate with existing main view
private struct MainAppView: View {
    var body: some View {
        // This should be replaced with the actual main app view
        Text("Main App")
    }
}

#if DEBUG
#Preview {
    OnboardingFlow()
}
#endif
