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
        ManagedNavigationStack(didComplete: $completedOnboardingFlow) {
            // New user - full onboarding flow
            Welcome()
            GoogleSignInView()
            Disclaimer()

            LLMSourceSelection()

            if HKHealthStore.isHealthDataAvailable() {
                HealthKitPermissions()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(!completedOnboardingFlow)
        .onAppear {
            // Returning users: if token exists, skip onboarding
            if KeychainService.shared.hasSessionToken && !completedOnboardingFlow {
                completedOnboardingFlow = true
            }
        }
    }
}

#if DEBUG
#Preview {
    OnboardingFlow()
}
#endif
