import MapHealthCore
import SwiftUI
import UIKit

struct MessageRow: View {
    let message: ChatMessage

    private var isUser: Bool { message.role == .user }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if isUser {
                Spacer(minLength: 24)
                messageBubble
                avatarIcon
            } else {
                avatarIcon
                messageBubble
                Spacer(minLength: 24)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var avatarIcon: some View {
        ZStack {
            Circle()
                .fill(isUser ? Color.accentColor : Color.purple)
                .frame(width: 28, height: 28)

            Image(systemName: isUser ? "person.fill" : "sparkles")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.white)
        }
    }

    private var messageBubble: some View {
        messageContent
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(bubbleBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    @ViewBuilder
    private var bubbleBackground: some View {
        if #available(iOS 26, *) {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(.clear)
                .glassEffect(
                    .regular.tint(isUser ? .accentColor.opacity(0.2) : .primary.opacity(0.05)),
                    in: .rect(cornerRadius: 16)
                )
        } else {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(isUser ? Color.accentColor.opacity(0.18) : Color.primary.opacity(0.05))
        }
    }

    private var messageContent: some View {
        Text(attributedMessage(message.content))
            .font(.body)
            .foregroundStyle(.primary)
            .textSelection(.enabled)
            .lineSpacing(4)
            .contextMenu {
                Button {
                    UIPasteboard.general.string = message.content
                } label: {
                    Label("Copy", systemImage: "doc.on.doc")
                }

                ShareLink(item: message.content) {
                    Label("Share", systemImage: "square.and.arrow.up")
                }
            }
    }

    private func attributedMessage(_ content: String) -> AttributedString {
        let options = AttributedString.MarkdownParsingOptions(
            interpretedSyntax: .inlineOnlyPreservingWhitespace,
            failurePolicy: .returnPartiallyParsedIfPossible
        )
        return (try? AttributedString(markdown: content, options: options)) ?? AttributedString(content)
    }
}

struct TypingIndicatorRow: View {
    @State private var animationPhase = 0

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.purple)
                    .frame(width: 28, height: 28)

                Image(systemName: "sparkles")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white)
            }

            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .fill(Color.secondary)
                        .frame(width: 8, height: 8)
                        .scaleEffect(animationPhase == index ? 1.2 : 0.8)
                        .opacity(animationPhase == index ? 1 : 0.4)
                }
            }
            .padding(.top, 8)

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .onAppear {
            startAnimation()
        }
    }

    private func startAnimation() {
        withAnimation(.easeInOut(duration: 0.4).repeatForever(autoreverses: false)) {
            animationPhase = 3
        }
        Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { _ in
            animationPhase = (animationPhase + 1) % 3
        }
    }
}

struct BottomMarkerPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = .zero

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

#Preview {
    GlassChatView(
        chat: .constant([
            ChatMessage(role: .user, content: "How did I sleep last night?"),
            ChatMessage(
                role: .assistant,
                content: """
                    Based on your health data, you had a **good night's sleep** of 7 hours and 23 minutes. \
                    Your sleep efficiency was 92%, which is above average.

                    Here are the key highlights:
                    - Deep sleep: 1h 45m (24%)
                    - REM sleep: 2h 10m (29%)
                    - Light sleep: 3h 28m (47%)
                    """
            ),
            ChatMessage(role: .user, content: "What about my heart rate?")
        ]),
        isGenerating: true
    )
}
