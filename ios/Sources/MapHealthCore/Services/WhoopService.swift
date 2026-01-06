import Foundation

@MainActor
public final class WhoopService: ObservableObject {
    public static let shared = WhoopService()

    @Published public private(set) var isConnected = false
    @Published public private(set) var recovery: WhoopRecovery?
    @Published public private(set) var cycle: WhoopCycle?
    @Published public private(set) var sleep: WhoopSleep?
    @Published public private(set) var workouts: [WhoopWorkout] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var error: Error?

    private let apiClient: MapAPIClient

    public init(apiClient: MapAPIClient = .shared) {
        self.apiClient = apiClient
    }

    public func refresh() async {
        guard apiClient.isAuthenticated else {
            reset()
            return
        }

        isLoading = true
        error = nil

        do {
            let profileResponse = try await apiClient.getWhoopProfile()
            isConnected = profileResponse.connected

            guard isConnected else {
                clearWhoopData()
                isLoading = false
                return
            }

            async let recoveryTask = apiClient.getWhoopRecovery()
            async let sleepTask = apiClient.getWhoopSleep()
            async let workoutsTask = apiClient.getWhoopWorkouts(limit: 5)

            let (recoveryResponse, sleepResponse, workoutsResponse) = try await (
                recoveryTask, sleepTask, workoutsTask
            )

            recovery = recoveryResponse.latest
            cycle = recoveryResponse.latestCycle
            sleep = sleepResponse.latest
            workouts = workoutsResponse.workouts
        } catch {
            self.error = error
            isConnected = false
        }

        isLoading = false
    }

    public func reset() {
        isConnected = false
        error = nil
        clearWhoopData()
        isLoading = false
    }

    private func clearWhoopData() {
        recovery = nil
        cycle = nil
        sleep = nil
        workouts = []
    }
}
