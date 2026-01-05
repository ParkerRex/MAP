import MapHealthCore
import SwiftUI

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
                    .foregroundStyle(.accentColor)
                Text("Heart")
                    .font(.subheadline)
                    .fontWeight(.medium)
            }

            HStack(spacing: 12) {
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
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)

        if showsSurface {
            content
                .mapHealthGlassSurface(cornerRadius: 18, tint: .accentColor.opacity(0.04))
        } else {
            content
        }
    }
}
