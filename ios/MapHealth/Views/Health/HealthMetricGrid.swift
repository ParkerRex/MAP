import MapHealthCore
import SwiftUI

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
                    .frame(height: 32)
                    .foregroundStyle(.quaternary)

                QuickStat(
                    value: formatCompact(calories),
                    label: "Calories",
                    icon: "flame.fill",
                    color: .orange,
                    isLoading: isLoading
                )

                Divider()
                    .frame(height: 32)
                    .foregroundStyle(.quaternary)

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
        .padding(.vertical, 14)
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
