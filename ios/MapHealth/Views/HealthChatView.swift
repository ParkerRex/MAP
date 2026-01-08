import AuthenticationServices
import Foundation
import MapHealthCore
import SwiftUI

struct HealthChatView: View {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @AppStorage(StorageKeys.openAIModel) private var openAIModel = StorageKeys.Defaults.openAIModel
    @AppStorage(StorageKeys.claudeModel) private var claudeModel = StorageKeys.Defaults.claudeModel
    @AppStorage(StorageKeys.llmSource) private var llmSourceRaw = StorageKeys.Defaults.llmSource

    @EnvironmentObject private var healthDataInterpreter: HealthDataInterpreter
    @Environment(\.webAuthenticationSession) private var webAuthSession
    @State private var showSettings = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    @State private var modelSettingRefreshId = UUID()
    @State private var messageTaskId = 0
    @State private var isReauthenticating = false
    @StateObject private var sessionService = SessionService.shared

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
            .navigationTitle("APP_TITLE")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    self.settingsButton
                }
            }
            .onChange(of: healthDataInterpreter.messages, initial: true) { _, newValue in
                if newValue.last?.role == .user {
                    self.messageTaskId += 1
                }
            }
            .task(id: self.messageTaskId) {
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
        .sheet(isPresented: $showSettings) {
            SettingsView(modelSettingRefreshId: $modelSettingRefreshId)
        }
        .alert("ERROR_ALERT_TITLE", isPresented: $showErrorAlert) {
            Button("ERROR_ALERT_CANCEL", role: .cancel) {}
        } message: {
            Text(self.errorMessage)
        }
        .onChange(of: llmSourceRaw) { _, _ in
            modelSettingRefreshId = UUID()
        }
        .task(id: self.modelSettingRefreshId) {
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

    private var settingsButton: some View {
        Button {
            showSettings = true
        } label: {
            Image(systemName: "gearshape")
                .accessibilityLabel(Text("SETTINGS_TITLE"))
        }
        .mapHealthGlassButtonStyle()
        .accessibilityIdentifier("settingsButton")
    }

    @MainActor
    private func startReauthentication() async -> Bool {
        if isReauthenticating {
            return false
        }

        isReauthenticating = true
        defer { isReauthenticating = false }

        do {
            let authURL = AppConfig.iosAuthURL()
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
            self.showErrorAlert = true
            self.errorMessage = String(
                format: String(localized: "SIGN_IN_REQUIRED_ERROR"),
                error.localizedDescription
            )
            return false
        }
    }

    private var llmSource: LLMSource {
        LLMSource(rawValue: llmSourceRaw) ?? .openai
    }
}
