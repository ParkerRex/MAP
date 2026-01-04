import MapHealthCore
import SwiftUI

// MARK: - Recovery Arc View

struct RecoveryArcView: View {
    let score: Double?
    let isLoading: Bool

    private var normalizedScore: Double {
        guard let score else { return 0 }
        return min(max(score / 100, 0), 1)
    }

    private var scoreColor: Color {
        guard let score else { return .gray }
        if score >= 67 { return .green }
        if score >= 34 { return .yellow }
        return .red
    }

    private var scoreLabel: String {
        guard let score else { return "--" }
        return "\(Int(score))"
    }

    private var statusText: String {
        guard let score else { return "No data" }
        if score >= 67 { return "Ready to perform" }
        if score >= 34 { return "Moderate recovery" }
        return "Take it easy"
    }

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                // Background arc
                Circle()
                    .trim(from: 0, to: 0.75)
                    .stroke(
                        Color.primary.opacity(0.1),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .rotationEffect(.degrees(135))

                // Progress arc
                if !isLoading {
                    Circle()
                        .trim(from: 0, to: normalizedScore * 0.75)
                        .stroke(
                            scoreColor,
                            style: StrokeStyle(lineWidth: 12, lineCap: .round)
                        )
                        .rotationEffect(.degrees(135))
                        .animation(.easeOut(duration: 0.8), value: normalizedScore)
                }

                // Score text
                VStack(spacing: 2) {
                    if isLoading {
                        SkeletonText(width: 50, height: 36)
                    } else {
                        Text(scoreLabel)
                            .font(.system(size: 38, weight: .bold, design: .rounded))
                            .foregroundStyle(scoreColor)
                        Text("%")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .frame(width: 110, height: 110)

            if !isLoading {
                Text(statusText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - Strain Gauge View

struct StrainGaugeView: View {
    let strain: Double?
    let isLoading: Bool

    private var normalizedStrain: Double {
        guard let strain else { return 0 }
        return min(strain / 21, 1) // Max strain is 21
    }

    private var strainColor: Color {
        guard let strain else { return .gray }
        if strain >= 18 { return .red }
        if strain >= 14 { return .orange }
        if strain >= 10 { return .yellow }
        return .blue
    }

    private var strainLabel: String {
        guard let strain else { return "--" }
        return String(format: "%.1f", strain)
    }

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                // Background arc
                Circle()
                    .trim(from: 0, to: 0.75)
                    .stroke(
                        Color.primary.opacity(0.1),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .rotationEffect(.degrees(135))

                // Progress arc
                if !isLoading {
                    Circle()
                        .trim(from: 0, to: normalizedStrain * 0.75)
                        .stroke(
                            strainColor,
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .rotationEffect(.degrees(135))
                        .animation(.easeOut(duration: 0.8), value: normalizedStrain)
                }

                VStack(spacing: 0) {
                    if isLoading {
                        SkeletonText(width: 30, height: 24)
                    } else {
                        Text(strainLabel)
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundStyle(strainColor)
                    }
                }
            }
            .frame(width: 64, height: 64)

            Text("Strain")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Hero Card

struct HealthHeroCard: View {
    let recovery: WhoopRecovery?
    let cycle: WhoopCycle?
    let whoopConnected: Bool
    let isLoading: Bool

    var body: some View {
        HStack(spacing: 16) {
            // Main recovery score
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "bolt.heart.fill")
                        .foregroundStyle(.green)
                    Text("Recovery")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }

                if whoopConnected {
                    RecoveryArcView(score: recovery?.recoveryScore.map { Double($0) }, isLoading: isLoading)
                } else {
                    VStack(spacing: 8) {
                        Image(systemName: "link.badge.plus")
                            .font(.title)
                            .foregroundStyle(.secondary)
                        Text("Connect WHOOP")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(width: 100, height: 100)
                }
            }

            Spacer()

            // Secondary metrics
            if whoopConnected {
                VStack(spacing: 16) {
                    StrainGaugeView(strain: cycle?.strainValue, isLoading: isLoading)

                    if let hrv = recovery?.hrv {
                        VStack(spacing: 2) {
                            Text("\(Int(hrv))")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundStyle(.pink)
                            Text("HRV")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .mapHealthGlassSurface(cornerRadius: 24, tint: .green.opacity(0.05))
    }
}
