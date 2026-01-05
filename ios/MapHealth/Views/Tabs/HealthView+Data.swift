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
        guard apiClient.isAuthenticated else { return }

        isLoadingWhoop = true

        do {
            let profileResponse = try await apiClient.getWhoopProfile()
            whoopConnected = profileResponse.connected

            guard whoopConnected else {
                isLoadingWhoop = false
                return
            }

            async let recoveryTask = apiClient.getWhoopRecovery()
            async let sleepTask = apiClient.getWhoopSleep()
            async let workoutsTask = apiClient.getWhoopWorkouts(limit: 5)

            let (recoveryResponse, sleepResponse, workoutsResponse) = try await (recoveryTask, sleepTask, workoutsTask)

            whoopRecovery = recoveryResponse.latest
            whoopCycle = recoveryResponse.latestCycle
            whoopSleep = sleepResponse.latest
            whoopWorkouts = workoutsResponse.workouts
        } catch {
            whoopConnected = false
        }

        isLoadingWhoop = false
    }
}
