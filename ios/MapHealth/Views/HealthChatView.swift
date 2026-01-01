import AuthenticationServices
import MapHealthCore
import SpeziChat
import SpeziLLM
import SpeziLLMFog
import SpeziLLMLocal
import SpeziLLMOpenAI
import SpeziSpeechSynthesizer
import SwiftUI

struct HealthChatView: View {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @AppStorage(StorageKeys.enableTextToSpeech) private var textToSpeech = StorageKeys.Defaults.enableTextToSpeech
    @AppStorage(StorageKeys.llmSource) private var llmSource = StorageKeys.Defaults.llmSource
    @AppStorage(StorageKeys.openAIModel) private var openAIModel = LLMOpenAIParameters.ModelType.gpt4o
    @AppStorage(StorageKeys.fogModel) private var fogModel = LLMFogParameters.FogModelType.llama3_1_8B

    @Environment(HealthDataInterpreter.self) private var healthDataInterpreter
    @Environment(\.webAuthenticationSession) private var webAuthSession
    @State private var showSettings = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    @State private var modelSettingRefreshId = UUID()
    @State private var messageTaskId = 0
    @State private var isReauthenticating = false

    var body: some View {
        NavigationStack {
            if let llm = self.healthDataInterpreter.llm {
                let contextBinding = Binding { llm.context.chat } set: { llm.context.chat = $0 }

                ChatView(contextBinding, exportFormat: .text)
                    .speak(llm.context.chat, muted: !self.textToSpeech)
                    .speechToolbarButton(muted: !self.$textToSpeech)
                    .viewStateAlert(state: llm.state)
                    .navigationTitle("Map Health")
                    .toolbar {
                        ToolbarItem(placement: .primaryAction) {
                            self.settingsButton
                        }
                        ToolbarItem(placement: .primaryAction) {
                            self.resetChatButton
                        }
                    }
                    .onChange(of: llm.context, initial: true) { _, _ in
                        if !llm.context.isEmpty && llm.state != .generating && llm.context.last?.role != .system {
                            self.messageTaskId += 1
                        }
                    }
                    .task(id: self.messageTaskId) {
                        do {
                            try await healthDataInterpreter.queryLLM()
                        } catch {
                            showErrorAlert = true
                            errorMessage = "Error querying LLM: \(error.localizedDescription)"
                        }
                    }
            } else {
                self.loadingChatView
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(modelSettingRefreshId: $modelSettingRefreshId)
        }
        .alert("Error", isPresented: $showErrorAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(self.errorMessage)
        }
        .task(id: self.modelSettingRefreshId) {
            do {
                if FeatureFlags.mockMode {
                    try await healthDataInterpreter.prepareLLM(with: LLMMockSchema())
                } else if FeatureFlags.localLLM || llmSource == .local {
                    try await healthDataInterpreter.prepareLLM(with: LLMLocalSchema(model: .llama3_2_3B_4bit))
                } else if llmSource == .fog {
                    try await healthDataInterpreter.prepareLLM(
                        with: LLMFogSchema(parameters: .init(modelType: self.fogModel))
                    )
                } else {
                    try await healthDataInterpreter.prepareLLM(
                        with: LLMOpenAISchema(parameters: .init(modelType: openAIModel))
                    )
                }
            } catch {
                self.showErrorAlert = true
                self.errorMessage = "Error initializing LLM: \(error.localizedDescription)"
            }
        }
        .task {
            MapAPIClient.shared.onAuthenticationRequired = {
                await startReauthentication()
            }
        }
    }

    private var settingsButton: some View {
        Button {
            showSettings = true
        } label: {
            Image(systemName: "gearshape")
                .accessibilityLabel(Text("Settings"))
        }
        .accessibilityIdentifier("settingsButton")
    }

    private var resetChatButton: some View {
        Button {
            Task {
                await healthDataInterpreter.resetChat()
            }
        } label: {
            Image(systemName: "arrow.counterclockwise")
                .accessibilityLabel(Text("Reset Chat"))
        }
        .accessibilityIdentifier("resetChatButton")
    }

    private var loadingChatView: some View {
        VStack {
            Text("Loading...")
            ProgressView()
        }
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
                prefersEphemeralWebBrowserSession: false
            )

            guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
                throw GoogleSignInError.invalidCallback("Invalid callback URL")
            }

            if let token = components.queryItems?.first(where: { $0.name == "token" })?.value {
                try KeychainService.shared.saveSessionToken(token)
                MapAPIClient.shared.setAuthToken(token)
                return true
            } else if let error = components.queryItems?.first(where: { $0.name == "error" })?.value {
                throw GoogleSignInError.authFailed(error)
            } else {
                throw GoogleSignInError.authFailed("Unknown error")
            }
        } catch ASWebAuthenticationSessionError.canceledLogin {
            return false
        } catch {
            self.showErrorAlert = true
            self.errorMessage = "Sign-in required: \(error.localizedDescription)"
            return false
        }
    }
}
