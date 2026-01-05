import HealthKit
import MapHealthCore
import SwiftUI

extension HealthView {
    var snapshot: HealthSnapshot? { healthService.snapshot }

    private func mapTrend(_ trend: Trend) -> HealthMetricTrend {
        HealthMetricTrend(label: trend.label, isPositive: trend.isPositive, delta: trend.percentChange)
    }

    var permissionView: some View {
        VStack(spacing: 20) {
            Image(systemName: "heart.text.square.fill")
                .font(.system(size: 80))
                .foregroundStyle(.accentColor)

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
        .mapHealthGlassSurface(cornerRadius: 24, tint: .accentColor.opacity(0.08))
    }

    func errorView(_ message: String) -> some View {
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

    var headerSection: some View {
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

    var activityGrid: some View {
        LazyVGrid(columns: gridColumns, spacing: 12) {
            CompactMetricCard(
                title: "Steps",
                value: formatNumber(snapshot?.today.steps),
                icon: "figure.walk",
                color: .green,
                trend: snapshot?.stepsTrend.map(mapTrend),
                isLoading: healthService.isLoading,
                showsSurface: false
            )
            CompactMetricCard(
                title: "Calories",
                value: formatNumber(snapshot?.today.activeEnergy, suffix: " kcal"),
                icon: "flame.fill",
                color: .orange,
                trend: snapshot?.caloriesTrend.map(mapTrend),
                isLoading: healthService.isLoading,
                showsSurface: false
            )
            CompactMetricCard(
                title: "Exercise",
                value: formatNumber(snapshot?.today.exerciseMinutes, suffix: " min"),
                icon: "figure.run",
                color: .cyan,
                trend: snapshot?.exerciseTrend.map(mapTrend),
                isLoading: healthService.isLoading,
                showsSurface: false
            )
            CompactMetricCard(
                title: "Stand",
                value: formatNumber(snapshot?.today.standMinutes.map { $0 / 60 }, suffix: " hr", decimals: 1),
                icon: "figure.stand",
                color: .blue,
                trend: snapshot?.standTrend.map(mapTrend),
                isLoading: healthService.isLoading,
                showsSurface: false
            )
        }
        .padding(12)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .primary.opacity(0.03))
    }

    var dataSourcesRow: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 12) {
                dataSourceBadge(
                    icon: "heart.text.square",
                    label: "Apple Health",
                    connected: !healthService.needsPermission,
                    color: .accentColor
                )
                if apiClient.isAuthenticated {
                    dataSourceBadge(
                        icon: "bolt.heart",
                        label: "WHOOP",
                        connected: whoopConnected,
                        color: .green
                    )
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                dataSourceBadge(
                    icon: "heart.text.square",
                    label: "Apple Health",
                    connected: !healthService.needsPermission,
                    color: .accentColor
                )
                if apiClient.isAuthenticated {
                    dataSourceBadge(
                        icon: "bolt.heart",
                        label: "WHOOP",
                        connected: whoopConnected,
                        color: .green
                    )
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
        HStack(spacing: 8) {
            Image(systemName: systemImage)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)

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
        .padding(.top, 2)
    }

    func section<Content: View>(
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

    var todayCard: some View {
        VStack(spacing: 12) {
            QuickStatsRow(
                steps: snapshot?.today.steps,
                calories: snapshot?.today.activeEnergy,
                exerciseMinutes: snapshot?.today.exerciseMinutes,
                isLoading: healthService.isLoading,
                showsSurface: false
            )

            Divider()
                .foregroundStyle(.quaternary)

            recoveryRow

            if whoopConnected, whoopSleep != nil {
                Divider()
                    .foregroundStyle(.quaternary)

                WhoopSleepQualitySection(sleep: whoopSleep, showsHeader: false, showsSurface: false)
            }
        }
        .padding(14)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .primary.opacity(0.03))
    }

    var recoveryRow: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 12) {
                SleepCompactCard(
                    sleepHours: snapshot?.today.sleepHours,
                    sleepStages: snapshot?.today.sleepStages,
                    average7d: snapshot?.sleepAverage7d,
                    trend: snapshot?.sleepTrend.map(mapTrend),
                    isLoading: healthService.isLoading,
                    showsSurface: false
                )

                HeartSectionCard(
                    restingHR: whoopConnected ? whoopRecovery?.restingHR : snapshot?.today.restingHeartRate,
                    hrv: whoopConnected ? whoopRecovery?.hrv : snapshot?.today.hrvSDNN,
                    restingHRTrend: snapshot?.restingHRTrend.map(mapTrend),
                    hrvTrend: snapshot?.hrvTrend.map(mapTrend),
                    isLoading: healthService.isLoading || isLoadingWhoop,
                    showsSurface: false
                )
            }

            VStack(spacing: 12) {
                SleepCompactCard(
                    sleepHours: snapshot?.today.sleepHours,
                    sleepStages: snapshot?.today.sleepStages,
                    average7d: snapshot?.sleepAverage7d,
                    trend: snapshot?.sleepTrend.map(mapTrend),
                    isLoading: healthService.isLoading,
                    showsSurface: false
                )

                HeartSectionCard(
                    restingHR: whoopConnected ? whoopRecovery?.restingHR : snapshot?.today.restingHeartRate,
                    hrv: whoopConnected ? whoopRecovery?.hrv : snapshot?.today.hrvSDNN,
                    restingHRTrend: snapshot?.restingHRTrend.map(mapTrend),
                    hrvTrend: snapshot?.hrvTrend.map(mapTrend),
                    isLoading: healthService.isLoading || isLoadingWhoop,
                    showsSurface: false
                )
            }
        }
    }

    var refreshButton: some View {
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
