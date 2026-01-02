import MapHealthCore
import SwiftUI

struct HealthView: View {
    @EnvironmentObject private var healthKitManager: HealthKitAuthorizationManager

    var body: some View {
        NavigationStack {
            healthContent
                .navigationTitle("Health")
        }
    }

    @ViewBuilder
    private var healthContent: some View {
        if #available(iOS 26, *) {
            ScrollView {
                healthBody
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .contentMargins(.vertical, 16, for: .scrollContent)
        } else {
            ScrollView {
                healthBody
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
            }
        }
    }

    private var healthBody: some View {
        LazyVStack(spacing: 20) {
            todaySection
            sleepSection
            activitySection
            heartSection
        }
    }

    private var todaySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today")
                .font(.headline)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                metricCard(
                    title: "Steps",
                    value: "--",
                    icon: "figure.walk",
                    color: .green
                )
                metricCard(
                    title: "Calories",
                    value: "--",
                    icon: "flame.fill",
                    color: .orange
                )
            }
        }
    }

    private var sleepSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Sleep")
                .font(.headline)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "moon.fill")
                        .foregroundStyle(.indigo)
                    Text("Last Night")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Text("-- hr -- min")
                    .font(.title2)
                    .fontWeight(.semibold)
            }
            .mapHealthGlassCard()
        }
    }

    private var activitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Activity")
                .font(.headline)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                metricCard(
                    title: "Exercise",
                    value: "-- min",
                    icon: "figure.run",
                    color: .cyan
                )
                metricCard(
                    title: "Stand",
                    value: "-- hr",
                    icon: "figure.stand",
                    color: .blue
                )
            }
        }
    }

    private var heartSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Heart")
                .font(.headline)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                metricCard(
                    title: "Resting HR",
                    value: "-- bpm",
                    icon: "heart.fill",
                    color: .red
                )
                metricCard(
                    title: "HRV",
                    value: "-- ms",
                    icon: "waveform.path.ecg",
                    color: .pink
                )
            }
        }
    }

    private func metricCard(
        title: String,
        value: String,
        icon: String,
        color: Color
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
    }
}
