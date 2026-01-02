import MapHealthCore
import SwiftUI

struct GlassChatView: View {
    @Binding var chat: [ChatMessage]
    var isInputEnabled: Bool = true
    var isGenerating: Bool = false
    @State private var draft = ""
    @FocusState private var isInputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            messagesScrollView

            Divider()
                .opacity(0.3)

            composerSection
        }
    }

    // MARK: - Messages

    private var messagesScrollView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(visibleMessages) { message in
                        MessageRow(message: message)
                            .id(message.id)
                    }

                    if isGenerating {
                        TypingIndicatorRow()
                            .id("typing-indicator")
                    }
                }
                .padding(.vertical, 16)
            }
            .scrollDismissesKeyboard(.interactively)
            .onAppear {
                scrollToBottom(proxy)
            }
            .onChange(of: chat.count) { _, _ in
                withAnimation(.easeOut(duration: 0.2)) {
                    scrollToBottom(proxy)
                }
            }
            .onChange(of: isGenerating) { _, generating in
                if generating {
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo("typing-indicator", anchor: .bottom)
                    }
                }
            }
        }
    }

    private var visibleMessages: [ChatMessage] {
        chat.filter { $0.role != .system }
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        if isGenerating {
            proxy.scrollTo("typing-indicator", anchor: .bottom)
        } else if let lastId = visibleMessages.last?.id {
            proxy.scrollTo(lastId, anchor: .bottom)
        }
    }

    // MARK: - Composer

    private var composerSection: some View {
        HStack(alignment: .bottom, spacing: 12) {
            TextField("CHAT_INPUT_PLACEHOLDER", text: $draft, axis: .vertical)
                .focused($isInputFocused)
                .lineLimit(1...6)
                .textInputAutocapitalization(.sentences)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background {
                    composerBackground
                }
                .disabled(!isInputEnabled)
                .accessibilityIdentifier("chatInput")
                .onSubmit {
                    sendMessage()
                }

            sendButton
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
    }

    @ViewBuilder
    private var composerBackground: some View {
        if #available(iOS 26, *) {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(.clear)
                .glassEffect(.regular.tint(.primary.opacity(0.03)), in: .rect(cornerRadius: 22))
        } else {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(.quaternary.opacity(0.5))
        }
    }

    private var sendButton: some View {
        Button {
            sendMessage()
        } label: {
            Image(systemName: "arrow.up")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 32, height: 32)
                .background(sendButtonEnabled ? Color.accentColor : Color.gray.opacity(0.4))
                .clipShape(Circle())
        }
        .disabled(!sendButtonEnabled)
        .accessibilityLabel(Text("CHAT_SEND"))
        .accessibilityIdentifier("chatSendButton")
        .animation(.easeInOut(duration: 0.15), value: sendButtonEnabled)
    }

    private var sendButtonEnabled: Bool {
        isInputEnabled && !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func sendMessage() {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        chat.append(ChatMessage(role: .user, content: trimmed))
        draft = ""
    }
}

// MARK: - Message Row

private struct MessageRow: View {
    let message: ChatMessage

    private var isUser: Bool { message.role == .user }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if !isUser {
                avatarIcon
            }

            messageContent
                .frame(maxWidth: .infinity, alignment: .leading)

            if isUser {
                avatarIcon
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(isUser ? Color.primary.opacity(0.04) : Color.clear)
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

    private var messageContent: some View {
        Text(attributedMessage(message.content))
            .font(.body)
            .foregroundStyle(.primary)
            .textSelection(.enabled)
            .lineSpacing(4)
    }

    private func attributedMessage(_ content: String) -> AttributedString {
        let options = AttributedString.MarkdownParsingOptions(
            interpretedSyntax: .inlineOnlyPreservingWhitespace,
            failurePolicy: .returnPartiallyParsedIfPossible
        )
        return (try? AttributedString(markdown: content, options: options)) ?? AttributedString(content)
    }
}

// MARK: - Typing Indicator

private struct TypingIndicatorRow: View {
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
