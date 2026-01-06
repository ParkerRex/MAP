import HealthKit
import MapHealthCore
import SwiftUI

struct HealthView: View {
    @EnvironmentObject var healthKitManager: HealthKitAuthorizationManager
    @StateObject var healthService = HealthDataService.shared
    @Environment(\.openURL) var openURL

    @StateObject var whoopService = WhoopService.shared

    let apiClient = MapAPIClient.shared

    let gridColumns = [
        GridItem(.adaptive(minimum: 160), spacing: 12)
    ]

    var whoopConnected: Bool { whoopService.isConnected }
    var whoopRecovery: WhoopRecovery? { whoopService.recovery }
    var whoopCycle: WhoopCycle? { whoopService.cycle }
    var whoopSleep: WhoopSleep? { whoopService.sleep }
    var whoopWorkouts: [WhoopWorkout] { whoopService.workouts }
    var isLoadingWhoop: Bool { whoopService.isLoading }
}
