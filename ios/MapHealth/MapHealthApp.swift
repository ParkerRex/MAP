import MapHealthCore
import SwiftUI

@main
struct MapHealthApp: App {
    @UIApplicationDelegateAdaptor(MapHealthAppDelegate.self) var appDelegate
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @StateObject private var healthDataInterpreter = HealthDataInterpreter()
    @StateObject private var healthKitManager = HealthKitAuthorizationManager()

    var body: some Scene {
        WindowGroup {
            Group {
                if completedOnboardingFlow {
                    MainTabView()
                } else {
                    EmptyView()
                }
            }
            .sheet(isPresented: !$completedOnboardingFlow) {
                OnboardingFlow()
            }
            .task {
                if KeychainService.shared.hasSessionToken && !completedOnboardingFlow {
                    completedOnboardingFlow = true
                }
            }
            .testingSetup()
            .environmentObject(healthDataInterpreter)
            .environmentObject(healthKitManager)
        }
    }
}
