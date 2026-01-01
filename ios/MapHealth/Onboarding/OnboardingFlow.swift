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
            // Check for returning user with valid session
            if KeychainService.shared.hasSessionToken {
                // Returning user - skip to disclaimer/LLM selection
                // (Google auth already complete)
                Disclaimer()

                LLMSourceSelection()

                if HKHealthStore.isHealthDataAvailable() {
                    HealthKitPermissions()
                }
            } else {
                // New user - full onboarding flow
                Welcome()
                GoogleSignInView()
                Disclaimer()

                LLMSourceSelection()

                if HKHealthStore.isHealthDataAvailable() {
                    HealthKitPermissions()
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(!completedOnboardingFlow)
        .onAppear {
            // If user already has a session token and completed onboarding before,
            // mark onboarding as complete immediately
            if KeychainService.shared.hasSessionToken && !completedOnboardingFlow {
                // Check if this is truly a returning user by verifying the token
                Task {
                    do {
                        // Try to fetch profile - if successful, user is authenticated
                        _ = try await MapAPIClient.shared.getProfile()
                        // Token is valid - auto-complete onboarding for returning users
                        await MainActor.run {
                            completedOnboardingFlow = true
                        }
                    } catch {
                        // Token invalid or expired - user needs to re-authenticate
                        // Clear invalid token and show full onboarding
                        MapAPIClient.shared.clearAuthToken()
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview {
    OnboardingFlow()
}
#endif
