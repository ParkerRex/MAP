import HealthKit
import MapHealthCore
import SwiftUI

/// Displays a multi-step onboarding flow for Map Health.
///
/// Flow:
/// 1. Google Sign-In - Authenticate with Google (required)
/// 2. LLM Source Selection (OpenAI or Claude)
/// 3. LLM Auth + Model Selection
/// 4. HealthKit Permissions - Required for health data access
struct OnboardingFlow: View {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @State private var path = [OnboardingRoute]()

    var body: some View {
        NavigationStack(path: $path) {
            GoogleSignInView {
                path.append(.llmSource)
            }
            .navigationDestination(for: OnboardingRoute.self) { route in
                switch route {
                case .llmSource:
                    LLMSourceSelection { source in
                        switch source {
                        case .openai:
                            path.append(.openAIKey)
                        case .claude:
                            path.append(.claudeAuth)
                        case .fog, .local:
                            path.append(.openAIKey)
                        }
                    }
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
                case .claudeAuth:
                    ClaudeAuthView {
                        path.append(.claudeModel)
                    }
                case .claudeModel:
                    ClaudeModelSelection {
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
