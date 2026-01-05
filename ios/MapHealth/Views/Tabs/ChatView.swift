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
    @State private var showLLMSettings = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                chatModelHeader
                    .padding(.horizontal, 16)
                    .padding(.top, 12)

                GlassChatView(
                    chat: Binding(
                        get: { healthDataInterpreter.messages },
                        set: { healthDataInterpreter.messages = $0 }
                    ),
                    isInputEnabled: !healthDataInterpreter.isGenerating,
                    isGenerating: healthDataInterpreter.isGenerating
                )
            }
            .sheet(
                isPresented: $showLLMSettings,
                onDismiss: { modelSettingRefreshId = UUID() },
                content: { LLMSettingsFlow() }
            )
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

    private var chatModelHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("LLM_SETTINGS_TITLE")
                    .font(.headline)
                Spacer()
                Button {
                    showLLMSettings = true
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "key.fill")
                        Text("API_KEY_TITLE")
                    }
                }
                .mapHealthGlassButtonStyle()
                .accessibilityIdentifier("apiKeyButton")
            }

            Picker("LLM_SOURCE_PICKER_LABEL", selection: $llmSourceRaw) {
                ForEach(LLMSource.chatSources) { source in
                    Text(source.localizedDescription)
                        .tag(source.rawValue)
                }
            }
            .pickerStyle(.segmented)
            .accessibilityIdentifier("llmSourcePicker")

            HStack {
                Text("MODEL_SELECTION_TITLE")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                Picker(selection: selectedModelBinding) {
                    ForEach(modelsForSource) { model in
                        Text(model.name)
                            .tag(model.id)
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(currentModelName)
                            .font(.subheadline.weight(.semibold))
                        Image(systemName: "chevron.down")
                            .font(.caption.weight(.semibold))
                    }
                    .foregroundStyle(.primary)
                }
                .pickerStyle(.menu)
                .accessibilityIdentifier("modelSelector")
            }
        }
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 20, tint: Color.accentColor.opacity(0.06))
    }

    private var selectedModelBinding: Binding<String> {
        Binding(
            get: { currentModelId },
            set: { updateModelSelection($0) }
        )
    }

    private func updateModelSelection(_ modelId: String) {
        switch llmSource {
        case .openai:
            openAIModel = modelId
        case .claude:
            claudeModel = modelId
        case .fog, .local:
            openAIModel = modelId
        }
        modelSettingRefreshId = UUID()
    }

    private var currentModelName: String {
        LLMModelCatalog.displayName(for: currentModelId, source: llmSource)
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

    private var modelsForSource: [LLMModelOption] {
        LLMModelCatalog.models(for: llmSource, currentModelId: currentModelId)
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
