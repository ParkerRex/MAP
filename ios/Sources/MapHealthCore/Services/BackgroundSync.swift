import BackgroundTasks
import Foundation
import HealthKit

/// Manages background syncing of health data to Map backend
public class BackgroundSyncManager {
    public static let shared = BackgroundSyncManager()
    public static let taskIdentifier = "com.map.health.sync"

    private let healthStore = HKHealthStore()

    private init() {}

    // MARK: - Background Task Registration

    public func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.taskIdentifier,
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGProcessingTask)
        }
    }

    public func scheduleBackgroundSync() {
        let request = BGProcessingTaskRequest(identifier: Self.taskIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false

        do {
            try BGTaskScheduler.shared.submit(request)
            print("Background sync scheduled")
        } catch {
            print("Failed to schedule background sync: \(error)")
        }
    }

    private func handleBackgroundSync(task: BGProcessingTask) {
        // Schedule next sync
        scheduleBackgroundSync()

        let syncTask = Task {
            do {
                try await performSync()
                task.setTaskCompleted(success: true)
            } catch {
                print("Background sync failed: \(error)")
                task.setTaskCompleted(success: false)
            }
        }

        task.expirationHandler = {
            syncTask.cancel()
        }
    }

    // MARK: - Health Data Sync

    public func performSync() async throws {
        guard MapAPIClient.shared.isAuthenticated else {
            throw MapAPIError.unauthorized
        }

        let fetcher = HealthDataFetcher()
        let healthData = await fetcher.fetchAndProcessHealthData()

        _ = try await MapAPIClient.shared.syncHealthData(healthData)

        // Update last sync time
        UserDefaults.standard.set(Date(), forKey: "map.lastSyncAt")
    }

    // MARK: - HealthKit Background Delivery

    public func enableBackgroundDelivery() {
        let types: [HKSampleType] = [
            HKQuantityType(.stepCount),
            HKQuantityType(.heartRate),
            HKQuantityType(.heartRateVariabilitySDNN),
            HKCategoryType(.sleepAnalysis)
        ]

        for type in types {
            healthStore.enableBackgroundDelivery(for: type, frequency: .hourly) { success, error in
                if let error = error {
                    print("Failed to enable background delivery for \(type): \(error)")
                } else if success {
                    print("Background delivery enabled for \(type)")
                }
            }
        }
    }

    public func setupBackgroundObservers() {
        let sleepType = HKCategoryType(.sleepAnalysis)

        let query = HKObserverQuery(sampleType: sleepType, predicate: nil) { _, completionHandler, error in
            if let error = error {
                print("Observer query error: \(error)")
                completionHandler()
                return
            }

            // New sleep data available - trigger sync
            Task {
                try? await self.performSync()
                completionHandler()
            }
        }

        healthStore.execute(query)
    }
}
