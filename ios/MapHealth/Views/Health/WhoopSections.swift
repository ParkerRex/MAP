import MapHealthCore
import SwiftUI

// MARK: - WHOOP Recovery Section

struct WhoopRecoverySection: View {
    let recovery: WhoopRecovery?
    let cycle: WhoopCycle?
    let isLoading: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "bolt.heart.fill")
                    .foregroundStyle(.green)
                Text("WHOOP")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text("Recovery & Strain")
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 12) {
                RecoveryCard(recovery: recovery, isLoading: isLoading)
                StrainCard(cycle: cycle, isLoading: isLoading)
            }
        }
    }
}

// MARK: - Recovery Card

struct RecoveryCard: View {
    let recovery: WhoopRecovery?
    let isLoading: Bool

    private var recoveryColor: Color {
        guard let score = recovery?.recoveryScore else { return .gray }
        if score >= 67 { return .green }
        if score >= 34 { return .yellow }
        return .red
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "arrow.up.heart.fill")
                    .foregroundStyle(recoveryColor)
                Text("Recovery")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            if isLoading {
                SkeletonText(width: 60, height: 24)
            } else {
                Text(WhoopFormatter.formatRecoveryScore(recovery?.recoveryScore))
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(recoveryColor)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: recoveryColor.opacity(0.1))
        .animation(.easeInOut(duration: 0.25), value: isLoading)
    }
}

// MARK: - Strain Card

struct StrainCard: View {
    let cycle: WhoopCycle?
    let isLoading: Bool

    private var strainColor: Color {
        guard let strain = cycle?.strainValue else { return .gray }
        if strain >= 18 { return .red }
        if strain >= 14 { return .orange }
        if strain >= 10 { return .yellow }
        return .blue
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "flame.fill")
                    .foregroundStyle(strainColor)
                Text("Strain")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            if isLoading {
                SkeletonText(width: 50, height: 24)
            } else {
                Text(WhoopFormatter.formatStrain(cycle?.strainValue))
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(strainColor)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: strainColor.opacity(0.1))
        .animation(.easeInOut(duration: 0.25), value: isLoading)
    }
}

// MARK: - Sleep Quality Section

struct WhoopSleepQualitySection: View {
    let sleep: WhoopSleep?
    let showsHeader: Bool
    let showsSurface: Bool

    init(sleep: WhoopSleep?, showsHeader: Bool = true, showsSurface: Bool = true) {
        self.sleep = sleep
        self.showsHeader = showsHeader
        self.showsSurface = showsSurface
    }

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 12) {
            if showsHeader {
                HStack {
                    Image(systemName: "moon.stars.fill")
                        .foregroundStyle(.indigo)
                    Text("Sleep Quality")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }
            }

            LazyVGrid(
                columns: [
                    GridItem(.adaptive(minimum: 90), spacing: 10)
                ],
                spacing: 12
            ) {
                SleepQualityMetric(
                    title: "Performance",
                    value: WhoopFormatter.formatPercentage(sleep?.performanceValue),
                    color: .green
                )
                SleepQualityMetric(
                    title: "Efficiency",
                    value: WhoopFormatter.formatPercentage(sleep?.efficiencyValue),
                    color: .blue
                )
                SleepQualityMetric(
                    title: "Consistency",
                    value: WhoopFormatter.formatPercentage(sleep?.consistencyValue),
                    color: .purple
                )
            }

            if let sleep = sleep {
                HStack(spacing: 16) {
                    if let respRate = sleep.respiratoryRateValue {
                        Label(
                            WhoopFormatter.formatRespiratoryRate(respRate),
                            systemImage: "lungs.fill"
                        )
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                    if let disturbances = sleep.disturbanceCount, disturbances > 0 {
                        Label(
                            "\(disturbances) disturbances",
                            systemImage: "exclamationmark.triangle.fill"
                        )
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(16)

        if showsSurface {
            content
                .mapHealthGlassSurface(cornerRadius: 16, tint: .indigo.opacity(0.05))
        } else {
            content
        }
    }
}

struct SleepQualityMetric: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundStyle(color)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Workouts Section

struct WhoopWorkoutsSection: View {
    let workouts: [WhoopWorkout]
    let showsHeader: Bool

    init(workouts: [WhoopWorkout], showsHeader: Bool = true) {
        self.workouts = workouts
        self.showsHeader = showsHeader
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if showsHeader {
                HStack {
                    Image(systemName: "figure.run")
                        .foregroundStyle(.orange)
                    Text("Recent Workouts")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }
            }

            ForEach(workouts.prefix(3)) { workout in
                WorkoutRow(workout: workout)
            }
        }
    }
}

struct WorkoutRow: View {
    let workout: WhoopWorkout

    private func strainColor(_ strain: Double) -> Color {
        if strain >= 18 { return .red }
        if strain >= 14 { return .orange }
        if strain >= 10 { return .yellow }
        return .blue
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(workout.sportName ?? "Workout")
                    .font(.subheadline)
                    .fontWeight(.medium)
                if let date = workout.startDate {
                    Text(date, style: .date)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                if let strain = workout.strainValue {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.caption)
                        Text(String(format: "%.1f", strain))
                            .fontWeight(.semibold)
                    }
                    .foregroundStyle(strainColor(strain))
                }
                if let duration = workout.durationMinutes {
                    Text("\(Int(duration)) min")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(12)
        .mapHealthGlassSurface(cornerRadius: 12, tint: .orange.opacity(0.05))
    }
}

// MARK: - Vitals Section

struct WhoopVitalsSection: View {
    let recovery: WhoopRecovery?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "waveform.path.ecg")
                    .foregroundStyle(.pink)
                Text("WHOOP Vitals")
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }

            LazyVGrid(
                columns: [GridItem(.flexible()), GridItem(.flexible())],
                spacing: 12
            ) {
                if let recovery = recovery {
                    VitalCard(
                        title: "Resting HR",
                        value: WhoopFormatter.formatRestingHR(recovery.restingHR),
                        icon: "heart.fill",
                        color: .red
                    )
                    VitalCard(
                        title: "HRV",
                        value: WhoopFormatter.formatHRV(recovery.hrv),
                        icon: "waveform.path.ecg",
                        color: .pink
                    )
                    if let spo2 = recovery.spo2 {
                        VitalCard(
                            title: "SpO2",
                            value: WhoopFormatter.formatSpO2(spo2),
                            icon: "drop.fill",
                            color: .cyan
                        )
                    }
                    if let temp = recovery.skinTemp {
                        VitalCard(
                            title: "Skin Temp",
                            value: WhoopFormatter.formatTempF(temp),
                            icon: "thermometer.medium",
                            color: .orange
                        )
                    }
                }
            }
        }
    }
}

struct VitalCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .mapHealthGlassSurface(cornerRadius: 12, tint: color.opacity(0.05))
    }
}
