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
    @StateObject private var sessionService = SessionService.shared

    private var selectedModelBinding: Binding<String> {
        Binding(
            get: { currentModelId },
            set: { updateModelSelection($0) }
        )
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

    private var chatBinding: Binding<[ChatMessage]> {
        Binding(
            get: { healthDataInterpreter.messages },
            set: { healthDataInterpreter.messages = $0 }
        )
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                headerCard
                    .padding(.horizontal, 16)
                    .padding(.top, 12)

                GlassChatView(
                    chat: chatBinding,
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

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            headerTitleRow
            sourcePickerRow
            modelPickerRow
        }
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 20, tint: Color.accentColor.opacity(0.06))
    }

    private var headerTitleRow: some View {
        HStack(spacing: 12) {
            Text("LLM_SETTINGS_TITLE")
                .font(.title3.weight(.semibold))

            Spacer()

            Button {
                showLLMSettings = true
            } label: {
                Label("API_KEY_TITLE", systemImage: "key.fill")
                    .labelStyle(.titleAndIcon)
            }
            .mapHealthGlassButtonStyle()
            .accessibilityIdentifier("apiKeyButton")
        }
    }

    private var sourcePickerRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("LLM_SOURCE_PICKER_LABEL")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)

            Picker("LLM_SOURCE_PICKER_LABEL", selection: $llmSourceRaw) {
                ForEach(LLMSource.chatSources) { source in
                    Text(source.localizedDescription)
                        .tag(source.rawValue)
                }
            }
            .pickerStyle(.segmented)
            .accessibilityIdentifier("llmSourcePicker")
        }
    }

    private var modelPickerRow: some View {
        HStack(alignment: .firstTextBaseline) {
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
        .padding(.top, 4)
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
                try sessionService.setSessionToken(token)
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
