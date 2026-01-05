import HealthKit
import MapHealthCore
import SwiftUI

struct HealthView: View {
    @EnvironmentObject var healthKitManager: HealthKitAuthorizationManager
    @StateObject var healthService = HealthDataService.shared
    @Environment(\.openURL) var openURL

    @State var whoopConnected = false
    @State var whoopRecovery: WhoopRecovery?
    @State var whoopCycle: WhoopCycle?
    @State var whoopSleep: WhoopSleep?
    @State var whoopWorkouts: [WhoopWorkout] = []
    @State var isLoadingWhoop = false

    let apiClient = MapAPIClient.shared

    let gridColumns = [
        GridItem(.adaptive(minimum: 160), spacing: 12)
    ]
}
