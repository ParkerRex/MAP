import Spezi
import SwiftUI

@main
struct MapHealthApp: App {
    @UIApplicationDelegateAdaptor(MapHealthAppDelegate.self) var appDelegate
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false

    var body: some Scene {
        WindowGroup {
            Group {
                if completedOnboardingFlow {
                    HealthChatView()
                } else {
                    EmptyView()
                }
            }
            .sheet(isPresented: !$completedOnboardingFlow) {
                OnboardingFlow()
            }
            .testingSetup()
            .spezi(appDelegate)
        }
    }
}
