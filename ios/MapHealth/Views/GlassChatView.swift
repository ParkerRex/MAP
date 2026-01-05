import MapHealthCore
import SwiftUI
import UIKit

struct GlassChatView: View {
    @Binding var chat: [ChatMessage]
    var isInputEnabled: Bool = true
    var isGenerating: Bool = false
    @State private var draft = ""
    @FocusState private var isInputFocused: Bool
    @State private var bottomMarkerY: CGFloat = .zero
    @State private var scrollViewHeight: CGFloat = .zero

    private let scrollToLatestThreshold: CGFloat = 44

    var body: some View {
        VStack(spacing: 0) {
            messagesScrollView

            Divider()
                .opacity(0.3)

            composerSection
        }
    }

    private var messagesScrollView: some View {
        GeometryReader { scrollProxy in
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 0) {
                        if visibleMessages.isEmpty && !isGenerating {
                            emptyStateView
                        } else {
                            ForEach(visibleMessages) { message in
                                MessageRow(message: message)
                                    .id(message.id)
                            }
                        }

                        if isGenerating {
                            TypingIndicatorRow()
                                .id("typing-indicator")
                        }

                        bottomMarker
                    }
                    .padding(.vertical, 16)
                }
                .coordinateSpace(name: "chat-scroll")
                .scrollDismissesKeyboard(.interactively)
                .onAppear {
                    scrollViewHeight = scrollProxy.size.height
                    scrollToBottom(proxy)
                }
                .onChange(of: scrollProxy.size.height) { _, newValue in
                    scrollViewHeight = newValue
                }
                .onPreferenceChange(BottomMarkerPreferenceKey.self) { value in
                    bottomMarkerY = value
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
                .overlay(alignment: .bottomTrailing) {
                    if shouldShowScrollToLatest {
                        Button {
                            withAnimation(.easeOut(duration: 0.2)) {
                                scrollToBottom(proxy)
                            }
                        } label: {
                            Image(systemName: "arrow.down")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.primary)
                                .frame(width: 36, height: 36)
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                                .shadow(color: .black.opacity(0.15), radius: 6, x: 0, y: 3)
                        }
                        .padding(.trailing, 16)
                        .padding(.bottom, 12)
                        .accessibilityLabel(Text("Scroll to latest"))
                    }
                }
            }
        }
    }

    private var shouldShowScrollToLatest: Bool {
        bottomMarkerY > scrollViewHeight + scrollToLatestThreshold
    }

    private var bottomMarker: some View {
        Color.clear
            .frame(height: 1)
            .background(
                GeometryReader { proxy in
                    Color.clear.preference(
                        key: BottomMarkerPreferenceKey.self,
                        value: proxy.frame(in: .named("chat-scroll")).minY
                    )
                }
            )
    }

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            VStack(spacing: 8) {
                Text("CHAT_EMPTY_TITLE")
                    .font(.title2.weight(.semibold))
                Text("CHAT_EMPTY_SUBTITLE")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            .multilineTextAlignment(.center)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 12)], spacing: 12) {
                ForEach(chatSuggestions, id: \.self) { suggestion in
                    Button {
                        sendMessage(text: suggestion)
                    } label: {
                        Text(suggestion)
                            .font(.callout.weight(.semibold))
                            .foregroundStyle(.primary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .frame(maxWidth: .infinity)
                            .background(suggestionChipBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .accessibilityLabel(Text(suggestion))
                }
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 40)
        .padding(.bottom, 20)
    }

    private var chatSuggestions: [String] {
        [
            String(localized: "CHAT_SUGGESTION_SLEEP"),
            String(localized: "CHAT_SUGGESTION_WORKOUTS"),
            String(localized: "CHAT_SUGGESTION_HEART_RATE")
        ]
    }

    @ViewBuilder
    private var suggestionChipBackground: some View {
        if #available(iOS 26, *) {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(.clear)
                .glassEffect(.regular.tint(.primary.opacity(0.04)), in: .rect(cornerRadius: 16))
        } else {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(.quaternary.opacity(0.5))
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

        sendMessage(text: trimmed)
    }

    private func sendMessage(text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        chat.append(ChatMessage(role: .user, content: trimmed))
        draft = ""
    }
}
