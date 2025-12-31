


import HealthKit
import HealthKit
import SpeziLLMOpenAI
import SpeziViews
import SwiftUI


/// Displays an multi-step onboarding flow for the Map Health.
struct OnboardingFlow: View {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @AppStorage(StorageKeys.llmSource) var llmSource = StorageKeys.Defaults.llmSource
    
    
    var body: some View {
        ManagedNavigationStack(didComplete: $completedOnboardingFlow) {
            Welcome()
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


#if DEBUG
#Preview {
    OnboardingFlow()
}
#endif
