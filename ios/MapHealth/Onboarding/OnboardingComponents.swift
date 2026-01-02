import SwiftUI

// MARK: - Onboarding Background

struct OnboardingBackground: View {
    var body: some View {
        ZStack {
            // Base gradient
            LinearGradient(
                colors: [
                    Color(.systemBackground),
                    Color(.systemGray6).opacity(0.5),
                    Color(.systemBackground)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Ambient gradient orbs
            GeometryReader { geo in
                // Top-left orb - blue
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.blue.opacity(0.15),
                                Color.blue.opacity(0)
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: geo.size.width * 0.4
                        )
                    )
                    .frame(width: geo.size.width * 0.8)
                    .offset(x: -geo.size.width * 0.3, y: -geo.size.height * 0.1)

                // Bottom-right orb - purple
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.purple.opacity(0.12),
                                Color.purple.opacity(0)
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: geo.size.width * 0.35
                        )
                    )
                    .frame(width: geo.size.width * 0.7)
                    .offset(x: geo.size.width * 0.5, y: geo.size.height * 0.6)

                // Center orb - green/teal
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.green.opacity(0.08),
                                Color.green.opacity(0)
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: geo.size.width * 0.25
                        )
                    )
                    .frame(width: geo.size.width * 0.5)
                    .offset(x: geo.size.width * 0.2, y: geo.size.height * 0.3)
            }
        }
        .ignoresSafeArea()
    }
}

// MARK: - Onboarding Header

struct OnboardingHeader: View {
    let title: LocalizedStringKey
    let subtitle: LocalizedStringKey?

    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.title)
                .fontWeight(.semibold)
                .fontDesign(.default)
                .multilineTextAlignment(.center)

            if let subtitle {
                Text(subtitle)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
}

// MARK: - Onboarding Screen

struct OnboardingScreen<Content: View, Footer: View>: View {
    let title: LocalizedStringKey
    let subtitle: LocalizedStringKey?
    @ViewBuilder let content: Content
    @ViewBuilder let footer: Footer

    init(
        title: LocalizedStringKey,
        subtitle: LocalizedStringKey? = nil,
        @ViewBuilder content: () -> Content,
        @ViewBuilder footer: () -> Footer
    ) {
        self.title = title
        self.subtitle = subtitle
        self.content = content()
        self.footer = footer()
    }

    var body: some View {
        ZStack {
            OnboardingBackground()

            Group {
                if #available(iOS 26, *) {
                    GlassEffectContainer(spacing: 20) {
                        screenStack
                    }
                } else {
                    screenStack
                }
            }
        }
    }

    private var screenStack: some View {
        VStack(spacing: 20) {
            ScrollView {
                VStack(spacing: 24) {
                    OnboardingHeader(title: title, subtitle: subtitle)
                    content
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
            }

            footer
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
        }
    }
}

// MARK: - Glass Effect Container (for iOS 26+)

@available(iOS 26, *)
struct GlassEffectContainer<Content: View>: View {
    let spacing: CGFloat
    @ViewBuilder let content: Content

    var body: some View {
        content
    }
}
