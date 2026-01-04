import MapHealthCore
import SwiftUI

// MARK: - Quick Stats Row

struct QuickStatsRow: View {
    let steps: Double?
    let calories: Double?
    let exerciseMinutes: Double?
    let isLoading: Bool
    let showsSurface: Bool

    init(
        steps: Double?,
        calories: Double?,
        exerciseMinutes: Double?,
        isLoading: Bool,
        showsSurface: Bool = true
    ) {
        self.steps = steps
        self.calories = calories
        self.exerciseMinutes = exerciseMinutes
        self.isLoading = isLoading
        self.showsSurface = showsSurface
    }

    var body: some View {
        let content = ViewThatFits(in: .horizontal) {
            HStack(spacing: 0) {
                QuickStat(
                    value: formatCompact(steps),
                    label: "Steps",
                    icon: "figure.walk",
                    color: .green,
                    isLoading: isLoading
                )

                Divider()
                    .frame(height: 40)

                QuickStat(
                    value: formatCompact(calories),
                    label: "Calories",
                    icon: "flame.fill",
                    color: .orange,
                    isLoading: isLoading
                )

                Divider()
                    .frame(height: 40)

                QuickStat(
                    value: exerciseMinutes.map { "\(Int($0))m" } ?? "--",
                    label: "Exercise",
                    icon: "figure.run",
                    color: .cyan,
                    isLoading: isLoading
                )
            }

            LazyVGrid(
                columns: [GridItem(.flexible()), GridItem(.flexible())],
                spacing: 12
            ) {
                QuickStat(
                    value: formatCompact(steps),
                    label: "Steps",
                    icon: "figure.walk",
                    color: .green,
                    isLoading: isLoading
                )
                QuickStat(
                    value: formatCompact(calories),
                    label: "Calories",
                    icon: "flame.fill",
                    color: .orange,
                    isLoading: isLoading
                )
                QuickStat(
                    value: exerciseMinutes.map { "\(Int($0))m" } ?? "--",
                    label: "Exercise",
                    icon: "figure.run",
                    color: .cyan,
                    isLoading: isLoading
                )
            }
        }
        .padding(.vertical, 16)
        .frame(maxWidth: .infinity)

        if showsSurface {
            content
                .mapHealthGlassSurface(cornerRadius: 16, tint: .clear)
        } else {
            content
        }
    }

    private func formatCompact(_ value: Double?) -> String {
        guard let value, value > 0 else { return "--" }
        if value >= 1000 {
            return String(format: "%.1fk", value / 1000)
        }
        return String(format: "%.0f", value)
    }
}

struct QuickStat: View {
    let value: String
    let label: String
    let icon: String
    let color: Color
    let isLoading: Bool

    var body: some View {
        VStack(spacing: 6) {
            if isLoading {
                SkeletonText(width: 40, height: 20)
            } else {
                HStack(spacing: 4) {
                    Image(systemName: icon)
                        .font(.caption)
                        .foregroundStyle(color)
                    Text(value)
                        .font(.headline)
                        .fontWeight(.bold)
                }
            }
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Compact Metric Card

struct CompactMetricCard: View {
    let title: String
    let value: String
    let subtitle: String?
    let icon: String
    let color: Color
    let trend: HealthMetricTrend?
    let isLoading: Bool

    init(
        title: String,
        value: String,
        subtitle: String? = nil,
        icon: String,
        color: Color,
        trend: HealthMetricTrend? = nil,
        isLoading: Bool = false
    ) {
        self.title = title
        self.value = value
        self.subtitle = subtitle
        self.icon = icon
        self.color = color
        self.trend = trend
        self.isLoading = isLoading
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundStyle(color)
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if isLoading {
                SkeletonText(width: 60, height: 24)
            } else {
                Text(value)
                    .font(.title3)
                    .fontWeight(.bold)

                if let subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }

                if let trend {
                    CompactTrendBadge(trend: trend)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .mapHealthGlassSurface(cornerRadius: 14, tint: color.opacity(0.04))
    }
}

// MARK: - Trend Badge

struct HealthMetricTrend {
    let label: String
    let isPositive: Bool
    let delta: Double

    static func from(current: Double?, history: [Double], higherIsBetter: Bool = true) -> HealthMetricTrend? {
        guard let current, current > 0 else { return nil }
        let valid = history.filter { $0 > 0 }
        guard valid.count >= 4 else { return nil }
        let previous = Array(valid.dropLast()).suffix(7)
        guard !previous.isEmpty else { return nil }
        let avg = previous.reduce(0, +) / Double(previous.count)
        guard avg > 0 else { return nil }
        let delta = (current - avg) / avg
        let magnitude = Swift.abs(delta)
        if magnitude < 0.02 {
            return HealthMetricTrend(label: "Avg", isPositive: true, delta: 0)
        }
        let percent = Int((magnitude * 100).rounded())
        let arrow = delta >= 0 ? "+" : "-"
        let label = "\(arrow)\(percent)%"
        let isPositive = higherIsBetter ? delta >= 0 : delta <= 0
        return HealthMetricTrend(label: label, isPositive: isPositive, delta: delta)
    }
}

struct CompactTrendBadge: View {
    let trend: HealthMetricTrend

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: trend.isPositive ? "arrow.up.right" : "arrow.down.right")
                .font(.system(size: 8, weight: .bold))
            Text(trend.label)
                .font(.caption2)
                .fontWeight(.semibold)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .foregroundStyle(trend.isPositive ? .green : .orange)
        .background(
            (trend.isPositive ? Color.green : Color.orange).opacity(0.15),
            in: RoundedRectangle(cornerRadius: 6)
        )
    }
}

// MARK: - Sleep Card (Redesigned)

struct SleepCompactCard: View {
    let sleepHours: Double?
    let sleepStages: SleepStages?
    let average7d: Double?
    let trend: HealthMetricTrend?
    let isLoading: Bool
    let showsSurface: Bool

    init(
        sleepHours: Double?,
        sleepStages: SleepStages?,
        average7d: Double?,
        trend: HealthMetricTrend?,
        isLoading: Bool,
        showsSurface: Bool = true
    ) {
        self.sleepHours = sleepHours
        self.sleepStages = sleepStages
        self.average7d = average7d
        self.trend = trend
        self.isLoading = isLoading
        self.showsSurface = showsSurface
    }

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "moon.fill")
                        .foregroundStyle(.indigo)
                    Text("Sleep")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                Spacer()
                if let trend, !isLoading {
                    CompactTrendBadge(trend: trend)
                }
            }

            if isLoading {
                VStack(alignment: .leading, spacing: 8) {
                    SkeletonText(width: 100, height: 28)
                    SkeletonRectangle(cornerRadius: 6)
                        .frame(height: 24)
                }
            } else {
                // Main value
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(formatSleepDuration(sleepHours))
                        .font(.title2)
                        .fontWeight(.bold)

                    if let average7d {
                        Text("avg \(formatHoursMinutes(average7d))")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }

                // Sleep stages visualization
                if let stages = sleepStages, stages.totalAsleep > 0 {
                    SleepStagesCompact(stages: stages)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)

        if showsSurface {
            content
                .mapHealthGlassSurface(cornerRadius: 18, tint: .indigo.opacity(0.05))
        } else {
            content
        }
    }

    private func formatSleepDuration(_ hours: Double?) -> String {
        guard let hours, hours > 0 else { return "--" }
        let wholeHours = Int(hours)
        let minutes = Int((hours - Double(wholeHours)) * 60)
        return "\(wholeHours)h \(minutes)m"
    }

    private func formatHoursMinutes(_ hours: Double) -> String {
        let wholeHours = Int(hours)
        let minutes = Int((hours - Double(wholeHours)) * 60)
        if wholeHours > 0 {
            return "\(wholeHours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}

// MARK: - Sleep Stages Compact

struct SleepStagesCompact: View {
    let stages: SleepStages

    private var total: Double {
        stages.totalAsleep
    }

    var body: some View {
        VStack(spacing: 8) {
            // Stacked bar with labels
            GeometryReader { geometry in
                HStack(spacing: 2) {
                    stageBar(
                        width: geometry.size.width * (stages.core / total),
                        color: .cyan.opacity(0.8),
                        label: "Light",
                        hours: stages.core
                    )
                    stageBar(
                        width: geometry.size.width * (stages.deep / total),
                        color: .blue,
                        label: "Deep",
                        hours: stages.deep
                    )
                    stageBar(
                        width: geometry.size.width * (stages.rem / total),
                        color: .purple,
                        label: "REM",
                        hours: stages.rem
                    )
                }
            }
            .frame(height: 24)
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
    }

    @ViewBuilder
    private func stageBar(width: CGFloat, color: Color, label: String, hours: Double) -> some View {
        if width > 30 {
            Rectangle()
                .fill(color)
                .frame(width: width)
                .overlay {
                    Text(formatHoursShort(hours))
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.white)
                }
        } else if width > 0 {
            Rectangle()
                .fill(color)
                .frame(width: width)
        }
    }

    private func formatHoursShort(_ hours: Double) -> String {
        let wholeHours = Int(hours)
        let minutes = Int((hours - Double(wholeHours)) * 60)
        if wholeHours > 0 {
            return "\(wholeHours)h"
        }
        return "\(minutes)m"
    }
}

// MARK: - Heart Section Card

struct HeartSectionCard: View {
    let restingHR: Double?
    let hrv: Double?
    let restingHRTrend: HealthMetricTrend?
    let hrvTrend: HealthMetricTrend?
    let isLoading: Bool
    let showsSurface: Bool

    init(
        restingHR: Double?,
        hrv: Double?,
        restingHRTrend: HealthMetricTrend?,
        hrvTrend: HealthMetricTrend?,
        isLoading: Bool,
        showsSurface: Bool = true
    ) {
        self.restingHR = restingHR
        self.hrv = hrv
        self.restingHRTrend = restingHRTrend
        self.hrvTrend = hrvTrend
        self.isLoading = isLoading
        self.showsSurface = showsSurface
    }

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
                Text("Heart")
                    .font(.subheadline)
                    .fontWeight(.medium)
            }

            HStack(spacing: 12) {
                // Resting HR
                VStack(alignment: .leading, spacing: 4) {
                    if isLoading {
                        SkeletonText(width: 50, height: 24)
                    } else {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(restingHR.map { "\(Int($0))" } ?? "--")
                                .font(.title3)
                                .fontWeight(.bold)
                            Text("bpm")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Text("Resting HR")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    if let trend = restingHRTrend, !isLoading {
                        CompactTrendBadge(trend: trend)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Divider()
                    .frame(height: 50)

                // HRV
                VStack(alignment: .leading, spacing: 4) {
                    if isLoading {
                        SkeletonText(width: 50, height: 24)
                    } else {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(hrv.map { "\(Int($0))" } ?? "--")
                                .font(.title3)
                                .fontWeight(.bold)
                            Text("ms")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Text("HRV")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    if let trend = hrvTrend, !isLoading {
                        CompactTrendBadge(trend: trend)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)

        if showsSurface {
            content
                .mapHealthGlassSurface(cornerRadius: 18, tint: .red.opacity(0.04))
        } else {
            content
        }
    }
}
