import HealthKit
import MapHealthCore
import SwiftUI

extension HealthView {
    var body: some View {
        NavigationStack {
            healthContent
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        if !healthService.needsPermission {
                            refreshButton
                        }
                    }
                }
        }
        .task {
            await loadAllData()
        }
    }

    @ViewBuilder
    var healthContent: some View {
        if #available(iOS 26, *) {
            ScrollView {
                healthBody
            }
            .contentMargins(.horizontal, 16, for: .scrollContent)
            .contentMargins(.vertical, 12, for: .scrollContent)
            .refreshable {
                healthService.invalidateCache()
                await loadAllData()
            }
        } else {
            ScrollView {
                healthBody
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
            }
            .refreshable {
                healthService.invalidateCache()
                await loadAllData()
            }
        }
    }

    var healthBody: some View {
        LazyVStack(spacing: 16) {
            headerSection

            if healthService.needsPermission {
                permissionView
            } else if let error = healthService.error {
                errorView(error.localizedDescription)
            } else {
                if apiClient.isAuthenticated {
                    section(
                        title: "WHOOP",
                        systemImage: "bolt.heart.fill",
                        footnote: whoopConnected ? "Connected" : nil
                    ) {
                        HealthHeroCard(
                            recovery: whoopRecovery,
                            cycle: whoopCycle,
                            whoopConnected: whoopConnected,
                            isLoading: isLoadingWhoop
                        )
                    }
                }

                section(title: "Today", systemImage: "sun.max.fill") {
                    todayCard
                }

                section(title: "Activity", systemImage: "figure.walk") {
                    activityGrid
                }

                if whoopConnected, !whoopWorkouts.isEmpty {
                    section(title: "Workouts", systemImage: "figure.run") {
                        WhoopWorkoutsSection(workouts: whoopWorkouts, showsHeader: false)
                    }
                }
            }
        }
    }
}
