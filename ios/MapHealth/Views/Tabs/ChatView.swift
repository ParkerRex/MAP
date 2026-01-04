import AuthenticationServices
import Foundation
import MapHealthCore
import SwiftUI

struct ChatView: View {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @AppStorage(StorageKeys.openAIModel) private var openAIModel = StorageKeys.Defaults.openAIModel
    @AppStorage(StorageKeys.claudeModel) private var claudeModel = StorageKeys.Defaults.claudeModel
    @AppStorage(StorageKeys.llmSource) private var llmSourceRaw = StorageKeys.Defaults.llmSource

    @EnvironmentObject private var healthDataInterpreter: HealthDataInterpreter
    @Environment(\.webAuthenticationSession) private var webAuthSession
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    @State private var modelSettingRefreshId = UUID()
    @State private var messageTaskId = 0
    @State private var isReauthenticating = false

    private static let openAIModels: [ModelOption] = [
        ModelOption(id: "gpt-4o", name: "GPT-4o"),
        ModelOption(id: "gpt-4o-mini", name: "GPT-4o mini")
    ]
    private static let claudeModels: [ModelOption] = [
        ModelOption(id: "claude-opus-4-20250514", name: "Opus (Most Capable)"),
        ModelOption(id: "claude-sonnet-4-20250514", name: "Sonnet (Balanced)"),
        ModelOption(id: "claude-3-5-haiku-20241022", name: "Haiku (Fast & Cheap)")
    ]

    var body: some View {
        NavigationStack {
            GlassChatView(
                chat: Binding(
                    get: { healthDataInterpreter.messages },
                    set: { healthDataInterpreter.messages = $0 }
                ),
                isInputEnabled: !healthDataInterpreter.isGenerating,
                isGenerating: healthDataInterpreter.isGenerating
            )
            .toolbar {
                ToolbarItem(placement: .principal) {
                    modelSelector
                }
                ToolbarItem(placement: .primaryAction) {
                    resetChatButton
                }
            }
            .onChange(of: healthDataInterpreter.messages, initial: true) { _, newValue in
                if newValue.last?.role == .user {
                    messageTaskId += 1
                }
            }
            .task(id: messageTaskId) {
                do {
                    try await healthDataInterpreter.queryLLM()
                } catch {
                    showErrorAlert = true
                    errorMessage = String(
                        format: String(localized: "CHAT_QUERY_ERROR"),
                        error.localizedDescription
                    )
                }
            }
        }
        .background(OnboardingBackground())
        .alert("ERROR_ALERT_TITLE", isPresented: $showErrorAlert) {
            Button("ERROR_ALERT_CANCEL", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
        .onChange(of: llmSourceRaw) { _, _ in
            modelSettingRefreshId = UUID()
        }
        .task(id: modelSettingRefreshId) {
            await healthDataInterpreter.prepareSession(
                source: llmSource,
                openAIModel: openAIModel,
                claudeModel: claudeModel
            )
        }
        .task {
            MapAPIClient.shared.onAuthenticationRequired = {
                await startReauthentication()
            }
        }
    }

    private var resetChatButton: some View {
        Button {
            Task {
                await healthDataInterpreter.resetChat()
            }
        } label: {
            Image(systemName: "arrow.counterclockwise")
                .accessibilityLabel(Text("SETTINGS_CHAT_RESET"))
        }
        .mapHealthGlassButtonStyle()
        .accessibilityIdentifier("resetChatButton")
    }

    private var modelSelector: some View {
        Menu {
            ForEach(modelsForSource) { model in
                Button {
                    switch llmSource {
                    case .openai:
                        openAIModel = model.id
                    case .claude:
                        claudeModel = model.id
                    case .fog, .local:
                        break
                    }
                    modelSettingRefreshId = UUID()
                } label: {
                    HStack {
                        Text(model.name)
                        if currentModelId == model.id {
                            Spacer()
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 4) {
                Text(currentModelName)
                    .font(.headline)
                Image(systemName: "chevron.down")
                    .font(.caption.weight(.semibold))
            }
            .foregroundStyle(.primary)
        }
        .accessibilityIdentifier("modelSelector")
    }

    private var currentModelName: String {
        modelsForSource.first { $0.id == currentModelId }?.name ?? currentModelId
    }

    private var currentModelId: String {
        switch llmSource {
        case .openai:
            return openAIModel
        case .claude:
            return claudeModel
        case .fog, .local:
            return openAIModel
        }
    }

    private var modelsForSource: [ModelOption] {
        switch llmSource {
        case .openai:
            return Self.openAIModels
        case .claude:
            return Self.claudeModels
        case .fog, .local:
            return Self.openAIModels
        }
    }

    private var llmSource: LLMSource {
        LLMSource(rawValue: llmSourceRaw) ?? .openai
    }

    @MainActor
    private func startReauthentication() async -> Bool {
        if isReauthenticating {
            return false
        }

        isReauthenticating = true
        defer { isReauthenticating = false }

        do {
            let authURL = URL(string: "\(AppConfig.webBaseURL)/api/auth/google?platform=ios")!
            let callbackScheme = "maphealth"

            let callbackURL = try await webAuthSession.authenticate(
                using: authURL,
                callbackURLScheme: callbackScheme,
                preferredBrowserSession: .shared
            )

            guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
                throw GoogleSignInError.invalidCallback(
                    String(localized: "GOOGLE_SIGNIN_INVALID_CALLBACK_URL")
                )
            }

            if let token = components.queryItems?.first(where: { $0.name == "token" })?.value {
                try KeychainService.shared.saveSessionToken(token)
                MapAPIClient.shared.setAuthToken(token)
                return true
            } else if let error = components.queryItems?.first(where: { $0.name == "error" })?.value {
                throw GoogleSignInError.authFailed(error)
            } else {
                throw GoogleSignInError.authFailed(String(localized: "GOOGLE_SIGNIN_UNKNOWN_ERROR"))
            }
        } catch ASWebAuthenticationSessionError.canceledLogin {
            return false
        } catch {
            showErrorAlert = true
            errorMessage = String(
                format: String(localized: "SIGN_IN_REQUIRED_ERROR"),
                error.localizedDescription
            )
            return false
        }
    }
}

private struct ModelOption: Identifiable {
    let id: String
    let name: String
}
