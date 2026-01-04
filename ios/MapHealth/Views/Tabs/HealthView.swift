import HealthKit
import MapHealthCore
import SwiftUI

struct HealthView: View {
    @EnvironmentObject private var healthKitManager: HealthKitAuthorizationManager
    @StateObject private var healthService = HealthDataService.shared
    @Environment(\.openURL) private var openURL

    // WHOOP State
    @State private var whoopConnected = false
    @State private var whoopRecovery: WhoopRecovery?
    @State private var whoopCycle: WhoopCycle?
    @State private var whoopSleep: WhoopSleep?
    @State private var whoopWorkouts: [WhoopWorkout] = []
    @State private var isLoadingWhoop = false

    private let apiClient = MapAPIClient.shared

    private let gridColumns = [
        GridItem(.adaptive(minimum: 160), spacing: 12)
    ]

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

    // MARK: - Snapshot Helper

    private var snapshot: HealthSnapshot? { healthService.snapshot }

    @ViewBuilder
    private var healthContent: some View {
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

    private var healthBody: some View {
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
                    QuickStatsRow(
                        steps: snapshot?.today.steps,
                        calories: snapshot?.today.activeEnergy,
                        exerciseMinutes: snapshot?.today.exerciseMinutes,
                        isLoading: healthService.isLoading
                    )

                    recoveryRow

                    if whoopConnected, whoopSleep != nil {
                        WhoopSleepQualitySection(sleep: whoopSleep, showsHeader: false)
                    }
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

    // MARK: - Trend Mapping

    private func mapTrend(_ trend: Trend) -> HealthMetricTrend {
        HealthMetricTrend(label: trend.label, isPositive: trend.isPositive, delta: trend.percentChange)
    }

    // MARK: - Permission View

    private var permissionView: some View {
        VStack(spacing: 20) {
            Image(systemName: "heart.text.square.fill")
                .font(.system(size: 80))
                .foregroundStyle(.red)

            Text("Access Your Health Data")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Grant access to HealthKit to see your steps, sleep, heart rate, and more.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button {
                Task { await requestPermission() }
            } label: {
                Label("Grant Access", systemImage: "heart.fill")
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 24, tint: .red.opacity(0.08))
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .orange.opacity(0.1))
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Health")
                .font(.system(size: 28, weight: .bold, design: .rounded))

            HStack(spacing: 10) {
                Text(Date(), format: .dateTime.weekday(.wide).month(.abbreviated).day())
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if let timestamp = snapshot?.timestamp {
                    updatedBadge(timestamp)
                }

                Spacer()
            }

            dataSourcesRow
        }
        .padding(.bottom, 2)
    }

    private func updatedBadge(_ timestamp: Date) -> some View {
        Text("Updated \(timestamp, style: .relative) ago")
            .font(.caption2)
            .foregroundStyle(.tertiary)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color.primary.opacity(0.06), in: Capsule())
    }

    // MARK: - Activity Grid

    private var activityGrid: some View {
        LazyVGrid(columns: gridColumns, spacing: 12) {
            CompactMetricCard(
                title: "Steps",
                value: formatNumber(snapshot?.today.steps),
                icon: "figure.walk",
                color: .green,
                trend: snapshot?.stepsTrend.map(mapTrend),
                isLoading: healthService.isLoading
            )
            CompactMetricCard(
                title: "Calories",
                value: formatNumber(snapshot?.today.activeEnergy, suffix: " kcal"),
                icon: "flame.fill",
                color: .orange,
                trend: snapshot?.caloriesTrend.map(mapTrend),
                isLoading: healthService.isLoading
            )
            CompactMetricCard(
                title: "Exercise",
                value: formatNumber(snapshot?.today.exerciseMinutes, suffix: " min"),
                icon: "figure.run",
                color: .cyan,
                trend: snapshot?.exerciseTrend.map(mapTrend),
                isLoading: healthService.isLoading
            )
            CompactMetricCard(
                title: "Stand",
                value: formatNumber(snapshot?.today.standMinutes.map { $0 / 60 }, suffix: " hr", decimals: 1),
                icon: "figure.stand",
                color: .blue,
                trend: snapshot?.standTrend.map(mapTrend),
                isLoading: healthService.isLoading
            )
        }
    }

    // MARK: - Data Sources Row

    private var dataSourcesRow: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 12) {
                dataSourceBadge(icon: "heart.text.square", label: "Apple Health", connected: !healthService.needsPermission, color: .red)
                if apiClient.isAuthenticated {
                    dataSourceBadge(icon: "bolt.heart", label: "WHOOP", connected: whoopConnected, color: .green)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                dataSourceBadge(icon: "heart.text.square", label: "Apple Health", connected: !healthService.needsPermission, color: .red)
                if apiClient.isAuthenticated {
                    dataSourceBadge(icon: "bolt.heart", label: "WHOOP", connected: whoopConnected, color: .green)
                }
            }
        }
    }

    private func dataSourceBadge(icon: String, label: String, connected: Bool, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption2)
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Circle()
                .fill(connected ? color : Color.orange)
                .frame(width: 6, height: 6)
        }
    }

    private func sectionHeader(title: String, systemImage: String, footnote: String? = nil) -> some View {
        VStack(spacing: 6) {
            HStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(title.uppercased())
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .tracking(0.6)

                if let footnote {
                    Text(footnote)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.primary.opacity(0.06), in: Capsule())
                }

                Spacer()
            }

            Divider()
                .foregroundStyle(.quaternary)
        }
        .padding(.top, 2)
    }

    private func section<Content: View>(
        title: String,
        systemImage: String,
        footnote: String? = nil,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(title: title, systemImage: systemImage, footnote: footnote)
            content()
        }
    }

    private var recoveryRow: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 12) {
                SleepCompactCard(
                    sleepHours: snapshot?.today.sleepHours,
                    sleepStages: snapshot?.today.sleepStages,
                    average7d: snapshot?.sleepAverage7d,
                    trend: snapshot?.sleepTrend.map(mapTrend),
                    isLoading: healthService.isLoading
                )

                HeartSectionCard(
                    restingHR: whoopConnected ? whoopRecovery?.restingHR : snapshot?.today.restingHeartRate,
                    hrv: whoopConnected ? whoopRecovery?.hrv : snapshot?.today.hrvSDNN,
                    restingHRTrend: snapshot?.restingHRTrend.map(mapTrend),
                    hrvTrend: snapshot?.hrvTrend.map(mapTrend),
                    isLoading: healthService.isLoading || isLoadingWhoop
                )
            }

            VStack(spacing: 12) {
                SleepCompactCard(
                    sleepHours: snapshot?.today.sleepHours,
                    sleepStages: snapshot?.today.sleepStages,
                    average7d: snapshot?.sleepAverage7d,
                    trend: snapshot?.sleepTrend.map(mapTrend),
                    isLoading: healthService.isLoading
                )

                HeartSectionCard(
                    restingHR: whoopConnected ? whoopRecovery?.restingHR : snapshot?.today.restingHeartRate,
                    hrv: whoopConnected ? whoopRecovery?.hrv : snapshot?.today.hrvSDNN,
                    restingHRTrend: snapshot?.restingHRTrend.map(mapTrend),
                    hrvTrend: snapshot?.hrvTrend.map(mapTrend),
                    isLoading: healthService.isLoading || isLoadingWhoop
                )
            }
        }
    }

    private var refreshButton: some View {
        Button {
            Task {
                healthService.invalidateCache()
                await loadAllData()
            }
        } label: {
            Image(systemName: "arrow.clockwise")
        }
        .mapHealthGlassButtonStyle()
        .disabled(healthService.isLoading || isLoadingWhoop)
    }

    // MARK: - Data Loading

    @MainActor
    private func loadAllData() async {
        async let healthTask: () = healthService.refresh()
        async let whoopTask: () = loadWhoopData()
        _ = await (healthTask, whoopTask)
    }

    @MainActor
    private func requestPermission() async {
        do {
            try await healthKitManager.requestAuthorization()
            await healthService.refresh()
        } catch {
            // Handled by service
        }
    }

    @MainActor
    private func loadWhoopData() async {
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

    // MARK: - Formatting

    private func formatNumber(_ value: Double?, suffix: String = "", decimals: Int = 0) -> String {
        guard let value, value > 0 else { return "--" }
        if value >= 1000 {
            return String(format: "%.1fk%@", value / 1000, suffix)
        }
        if decimals > 0 {
            return String(format: "%.\(decimals)f%@", value, suffix)
        }
        return String(format: "%.0f%@", value, suffix)
    }
}
