import MapHealthCore
import OSLog
import SwiftUI

struct HealthKitPermissions: View {
    @EnvironmentObject private var healthKitManager: HealthKitAuthorizationManager
    @State var healthKitProcessing = false
    let logger = Logger(subsystem: "MapHealth", category: "Onboarding")
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "HEALTHKIT_PERMISSIONS_TITLE",
            subtitle: "HEALTHKIT_PERMISSIONS_SUBTITLE"
        ) {
            VStack(spacing: 16) {
                Image(systemName: "heart.text.square.fill")
                    .accessibilityHidden(true)
                    .font(.system(size: 150))
                    .foregroundColor(.accentColor)
                Text("HEALTHKIT_PERMISSIONS_DESCRIPTION")
                    .multilineTextAlignment(.center)
            }
            .padding(20)
            .mapHealthGlassSurface(cornerRadius: 24, tint: .accentColor.opacity(0.08))
        } footer: {
            Button("HEALTHKIT_PERMISSIONS_BUTTON") {
                Task {
                    do {
                        healthKitProcessing = true
                        if ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1" {
                            try await _Concurrency.Task.sleep(for: .seconds(5))
                        } else {
                            try await healthKitManager.requestAuthorization()
                        }
                    } catch {
                        logger.error("Could not request HealthKit permissions: \(error.localizedDescription)")
                    }
                    healthKitProcessing = false
                    onContinue()
                }
            }
            .mapHealthGlassButtonStyle(prominent: true)
            .disabled(healthKitProcessing)
        }
        .navigationBarBackButtonHidden(healthKitProcessing)
    }
}

#if DEBUG
#Preview {
    HealthKitPermissions {}
        .environmentObject(HealthKitAuthorizationManager())
}
#endif
