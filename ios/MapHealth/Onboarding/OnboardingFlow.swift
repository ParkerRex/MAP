import HealthKit
import MapHealthCore
import SwiftUI

/// Displays a multi-step onboarding flow for Map Health.
///
/// Flow:
/// 1. Google Sign-In - Authenticate with Google (required)
/// 2. OpenAI API Key
/// 3. OpenAI Model Selection
/// 4. HealthKit Permissions - Required for health data access
struct OnboardingFlow: View {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @State private var path = [OnboardingRoute]()

    var body: some View {
        NavigationStack(path: $path) {
            GoogleSignInView {
                path.append(.openAIKey)
            }
            .navigationDestination(for: OnboardingRoute.self) { route in
                switch route {
                case .openAIKey:
                    OpenAIAPIKey {
                        path.append(.openAIModel)
                    }
                case .openAIModel:
                    OpenAIModelSelection {
                        if HKHealthStore.isHealthDataAvailable() {
                            path.append(.healthKit)
                        } else {
                            completedOnboardingFlow = true
                        }
                    }
                case .healthKit:
                    HealthKitPermissions {
                        completedOnboardingFlow = true
                    }
                }
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
