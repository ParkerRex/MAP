import MapHealthCore
import SwiftUI

struct GlassChatView: View {
    @Binding var chat: [ChatMessage]
    var isInputEnabled: Bool = true
    @State private var draft = ""
    @FocusState private var isInputFocused: Bool
    @Namespace private var chatNamespace

    var body: some View {
        chatContainer
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
    }

    @ViewBuilder
    private var chatContainer: some View {
        if #available(iOS 26, *) {
            GlassEffectContainer(spacing: 12) {
                chatContent
            }
        } else {
            chatContent
        }
    }

    private var chatContent: some View {
        VStack(spacing: 12) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(visibleMessages) { message in
                            messageRow(message)
                                .id(message.id)
                        }
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 4)
                }
                .onAppear {
                    scrollToBottom(proxy)
                }
                .onChange(of: chat.last?.id) { _, _ in
                    withAnimation(.easeInOut(duration: 0.2)) {
                        scrollToBottom(proxy)
                    }
                }
            }
            .mapHealthGlassSurface(cornerRadius: 24, tint: .accentColor.opacity(0.04))

            composer
        }
    }

    private var visibleMessages: [ChatMessage] {
        chat.filter { $0.role != .system }
    }

    private func messageRow(_ message: ChatMessage) -> some View {
        let isUser = message.role == .user

        return HStack {
            if isUser {
                Spacer(minLength: 40)
            }

            messageBubble(message: message, isUser: isUser)

            if !isUser {
                Spacer(minLength: 40)
            }
        }
        .frame(maxWidth: .infinity, alignment: isUser ? .trailing : .leading)
        .padding(.horizontal, 4)
    }

    @ViewBuilder
    private func messageBubble(message: ChatMessage, isUser: Bool) -> some View {
        let bubble = Text(attributedMessage(message.content))
            .font(.body)
            .foregroundStyle(.primary)
            .padding(12)
            .mapHealthGlassSurface(
                cornerRadius: 20,
                tint: isUser ? .accentColor.opacity(0.18) : .white.opacity(0.08)
            )
            .frame(maxWidth: 320, alignment: isUser ? .trailing : .leading)

        if #available(iOS 26, *) {
            bubble.glassEffectID(message.id.uuidString, in: chatNamespace)
        } else {
            bubble
        }
    }

    private var composer: some View {
        HStack(spacing: 12) {
            TextField("CHAT_INPUT_PLACEHOLDER", text: $draft, axis: .vertical)
                .focused($isInputFocused)
                .lineLimit(1...4)
                .textInputAutocapitalization(.sentences)
                .submitLabel(.send)
                .onSubmit {
                    sendMessage()
                }
                .disabled(!isInputEnabled)
                .accessibilityIdentifier("chatInput")

            Button {
                sendMessage()
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .semibold))
            }
            .accessibilityLabel(Text("CHAT_SEND"))
            .mapHealthGlassButtonStyle(prominent: true)
            .disabled(!isInputEnabled || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .accessibilityIdentifier("chatSendButton")
        }
        .padding(12)
        .mapHealthGlassSurface(
            cornerRadius: 24,
            tint: .accentColor.opacity(0.08),
            interactive: true
        )
    }

    private func sendMessage() {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        chat.append(ChatMessage(role: .user, content: trimmed))
        draft = ""
    }

    private func attributedMessage(_ content: String) -> AttributedString {
        let options = AttributedString.MarkdownParsingOptions(
            interpretedSyntax: .inlineOnlyPreservingWhitespace,
            failurePolicy: .returnPartiallyParsedIfPossible
        )
        return (try? AttributedString(markdown: content, options: options)) ?? AttributedString(content)
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        if let lastId = visibleMessages.last?.id {
            proxy.scrollTo(lastId, anchor: .bottom)
        }
    }
}
