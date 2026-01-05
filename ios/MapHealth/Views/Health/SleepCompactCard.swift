import MapHealthCore
import SwiftUI

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

                if let stages = sleepStages, stages.totalAsleep > 0 {
                    SleepStagesCompact(stages: stages)
                }
            }
        }
        .padding(14)
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

struct SleepStagesCompact: View {
    let stages: SleepStages

    private var total: Double {
        stages.totalAsleep
    }

    var body: some View {
        VStack(spacing: 8) {
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
