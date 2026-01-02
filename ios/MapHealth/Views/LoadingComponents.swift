import SwiftUI

// MARK: - Shimmer Effect

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = -1

    func body(content: Content) -> some View {
        content
            .overlay {
                GeometryReader { geometry in
                    LinearGradient(
                        colors: [
                            .clear,
                            .white.opacity(0.4),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: geometry.size.width * 0.6)
                    .offset(x: phase * (geometry.size.width * 1.6))
                    .blendMode(.sourceAtop)
                }
            }
            .onAppear {
                withAnimation(
                    .linear(duration: 1.2)
                        .repeatForever(autoreverses: false)
                ) {
                    phase = 1
                }
            }
    }
}

extension View {
    func shimmer() -> some View {
        modifier(ShimmerModifier())
    }
}

// MARK: - Skeleton Shapes

struct SkeletonText: View {
    var width: CGFloat = 120
    var height: CGFloat = 14

    var body: some View {
        RoundedRectangle(cornerRadius: height / 3)
            .fill(Color.primary.opacity(0.08))
            .frame(width: width, height: height)
            .shimmer()
    }
}

struct SkeletonCircle: View {
    var size: CGFloat = 32

    var body: some View {
        Circle()
            .fill(Color.primary.opacity(0.08))
            .frame(width: size, height: size)
            .shimmer()
    }
}

struct SkeletonRectangle: View {
    var cornerRadius: CGFloat = 8

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(Color.primary.opacity(0.08))
            .shimmer()
    }
}

// MARK: - Skeleton Task Row

struct SkeletonTaskRow: View {
    var body: some View {
        HStack(spacing: 12) {
            SkeletonCircle(size: 24)

            VStack(alignment: .leading, spacing: 6) {
                SkeletonText(width: .random(in: 140...220), height: 16)
                SkeletonText(width: .random(in: 80...120), height: 12)
            }

            Spacer()

            SkeletonText(width: 50, height: 12)
        }
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .primary.opacity(0.02))
    }
}

// MARK: - Skeleton Tasks List

struct SkeletonTasksList: View {
    var count: Int = 4

    var body: some View {
        VStack(spacing: 8) {
            ForEach(0..<count, id: \.self) { index in
                SkeletonTaskRow()
                    .opacity(1.0 - (Double(index) * 0.15))
            }
        }
        .transition(.opacity.combined(with: .scale(scale: 0.98)))
    }
}

// MARK: - Skeleton Metric Card

struct SkeletonMetricCard: View {
    var color: Color = .accentColor

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                SkeletonCircle(size: 20)
                SkeletonText(width: 60, height: 14)
            }

            SkeletonText(width: 80, height: 22)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: color.opacity(0.04))
    }
}

// MARK: - Skeleton Calendar Event

struct SkeletonCalendarEvent: View {
    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(Color.primary.opacity(0.08))
                .frame(width: 4, height: 40)
                .shimmer()

            VStack(alignment: .leading, spacing: 4) {
                SkeletonText(width: .random(in: 100...180), height: 14)
                SkeletonText(width: 80, height: 12)
            }
        }
        .padding(12)
        .mapHealthGlassSurface(cornerRadius: 12, tint: .primary.opacity(0.02))
    }
}

// MARK: - Skeleton Calendar List

struct SkeletonCalendarList: View {
    var count: Int = 3

    var body: some View {
        VStack(spacing: 8) {
            ForEach(0..<count, id: \.self) { index in
                SkeletonCalendarEvent()
                    .opacity(1.0 - (Double(index) * 0.2))
            }
        }
        .transition(.opacity.combined(with: .scale(scale: 0.98)))
    }
}

// MARK: - Skeleton Sleep Card

struct SkeletonSleepCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                SkeletonCircle(size: 20)
                SkeletonText(width: 80, height: 14)
            }

            SkeletonText(width: 120, height: 24)

            // Sleep stages bar skeleton
            SkeletonRectangle(cornerRadius: 4)
                .frame(height: 8)

            // Legend skeleton
            HStack(spacing: 16) {
                ForEach(0..<3, id: \.self) { _ in
                    HStack(spacing: 4) {
                        SkeletonCircle(size: 8)
                        SkeletonText(width: 50, height: 12)
                    }
                }
            }
        }
        .mapHealthGlassCard()
    }
}

// MARK: - Skeleton WHOOP Recovery Card

struct SkeletonWhoopCard: View {
    var body: some View {
        VStack(spacing: 16) {
            // Score circle skeleton
            SkeletonCircle(size: 100)

            // Title
            SkeletonText(width: 80, height: 16)

            // Metrics row
            HStack(spacing: 24) {
                ForEach(0..<3, id: \.self) { _ in
                    VStack(spacing: 4) {
                        SkeletonText(width: 40, height: 18)
                        SkeletonText(width: 50, height: 12)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .mapHealthGlassSurface(cornerRadius: 24, tint: .green.opacity(0.06))
    }
}

// MARK: - Pulse Animation Modifier

struct PulseModifier: ViewModifier {
    @State private var isAnimating = false

    func body(content: Content) -> some View {
        content
            .opacity(isAnimating ? 0.4 : 1.0)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 0.8)
                        .repeatForever(autoreverses: true)
                ) {
                    isAnimating = true
                }
            }
    }
}

extension View {
    func pulse() -> some View {
        modifier(PulseModifier())
    }
}

// MARK: - Loading Overlay

struct LoadingOverlay: View {
    var message: String?

    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.2)
                    .tint(.white)

                if let message {
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(.white)
                }
            }
            .padding(24)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
        .transition(.opacity)
    }
}

// MARK: - Improved Typing Indicator

struct TypingIndicator: View {
    @State private var dotScales: [CGFloat] = [0.6, 0.6, 0.6]

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(Color.secondary)
                    .frame(width: 8, height: 8)
                    .scaleEffect(dotScales[index])
            }
        }
        .onAppear {
            animateDots()
        }
    }

    private func animateDots() {
        for index in 0..<3 {
            withAnimation(
                .easeInOut(duration: 0.4)
                    .repeatForever(autoreverses: true)
                    .delay(Double(index) * 0.15)
            ) {
                dotScales[index] = 1.2
            }
        }
    }
}

// MARK: - Content Loading View

struct ContentLoadingView<Content: View, Placeholder: View>: View {
    let isLoading: Bool
    @ViewBuilder let content: () -> Content
    @ViewBuilder let placeholder: () -> Placeholder

    var body: some View {
        Group {
            if isLoading {
                placeholder()
            } else {
                content()
            }
        }
        .animation(.easeInOut(duration: 0.25), value: isLoading)
    }
}

// MARK: - Previews

#Preview("Skeleton Tasks") {
    ScrollView {
        VStack(spacing: 16) {
            SkeletonTasksList()
        }
        .padding()
    }
    .background(Color(.systemGroupedBackground))
}

#Preview("Skeleton Metrics") {
    VStack(spacing: 12) {
        HStack(spacing: 12) {
            SkeletonMetricCard(color: .green)
            SkeletonMetricCard(color: .orange)
        }
        HStack(spacing: 12) {
            SkeletonMetricCard(color: .cyan)
            SkeletonMetricCard(color: .blue)
        }
    }
    .padding()
    .background(Color(.systemGroupedBackground))
}

#Preview("Skeleton Sleep") {
    SkeletonSleepCard()
        .padding()
        .background(Color(.systemGroupedBackground))
}

#Preview("Skeleton Calendar") {
    VStack(spacing: 16) {
        SkeletonCalendarList()
    }
    .padding()
    .background(Color(.systemGroupedBackground))
}
