import MapHealthCore
import SwiftUI

@main
struct MapHealthApp: App {
    @UIApplicationDelegateAdaptor(MapHealthAppDelegate.self) var appDelegate
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @AppStorage(StorageKeys.appearanceMode) private var appearanceModeRaw = StorageKeys.Defaults.appearanceMode
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
            .preferredColorScheme(appearanceMode?.colorScheme)
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

    private var appearanceMode: AppearanceMode? {
        AppearanceMode(rawValue: appearanceModeRaw)
    }
}

private enum AppearanceMode: String {
    case system
    case light
    case dark

    var colorScheme: ColorScheme? {
        switch self {
        case .system:
            return nil
        case .light:
            return .light
        case .dark:
            return .dark
        }
    }
}
