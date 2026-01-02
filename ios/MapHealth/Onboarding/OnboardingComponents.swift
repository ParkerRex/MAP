import SwiftUI

struct OnboardingBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(.systemBackground),
                    Color(.systemGray6),
                    Color(.systemBackground)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.accentColor.opacity(0.15), Color.accentColor.opacity(0)],
                        center: .center,
                        startRadius: 0,
                        endRadius: 110
                    )
                )
                .frame(width: 220, height: 220)
                .offset(x: -140, y: -220)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.accentColor.opacity(0.12), Color.accentColor.opacity(0)],
                        center: .center,
                        startRadius: 0,
                        endRadius: 90
                    )
                )
                .frame(width: 180, height: 180)
                .offset(x: 150, y: 220)
        }
        .ignoresSafeArea()
        .drawingGroup()
    }
}

struct OnboardingHeader: View {
    let title: LocalizedStringKey
    let subtitle: LocalizedStringKey?

    var body: some View {
        VStack(spacing: 12) {
            Text(title)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center)
            if let subtitle {
                Text(subtitle)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(24)
        .mapHealthGlassSurface(cornerRadius: 24, tint: .accentColor.opacity(0.08))
    }
}

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
