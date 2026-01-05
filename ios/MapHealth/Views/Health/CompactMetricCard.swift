import MapHealthCore
import SwiftUI

struct CompactMetricCard: View {
    let title: String
    let value: String
    let subtitle: String?
    let icon: String
    let color: Color
    let trend: HealthMetricTrend?
    let isLoading: Bool
    let showsSurface: Bool

    init(
        title: String,
        value: String,
        subtitle: String? = nil,
        icon: String,
        color: Color,
        trend: HealthMetricTrend? = nil,
        isLoading: Bool = false,
        showsSurface: Bool = true
    ) {
        self.title = title
        self.value = value
        self.subtitle = subtitle
        self.icon = icon
        self.color = color
        self.trend = trend
        self.isLoading = isLoading
        self.showsSurface = showsSurface
    }

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 10) {
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

        if showsSurface {
            content
                .mapHealthGlassSurface(cornerRadius: 14, tint: color.opacity(0.04))
        } else {
            content
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.primary.opacity(0.06), lineWidth: 1)
                )
        }
    }
}

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
