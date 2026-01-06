import HealthKit
import MapHealthCore
import SwiftUI

extension HealthView {
    @MainActor
    func loadAllData() async {
        async let healthTask: () = healthService.refresh()
        async let whoopTask: () = loadWhoopData()
        _ = await (healthTask, whoopTask)
    }

    @MainActor
    func requestPermission() async {
        do {
            try await healthKitManager.requestAuthorization()
            await healthService.refresh()
        } catch {
            // Handled by service
        }
    }

    @MainActor
    func loadWhoopData() async {
        await whoopService.refresh()
    }
}
