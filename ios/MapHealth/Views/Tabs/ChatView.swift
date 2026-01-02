import AuthenticationServices
import Foundation
import MapHealthCore
import SwiftUI

struct ChatView: View {
    @AppStorage(StorageKeys.onboardingFlowComplete) var completedOnboardingFlow = false
    @AppStorage(StorageKeys.openAIModel) private var openAIModel = StorageKeys.Defaults.openAIModel

    @EnvironmentObject private var healthDataInterpreter: HealthDataInterpreter
    @Environment(\.webAuthenticationSession) private var webAuthSession
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    @State private var modelSettingRefreshId = UUID()
    @State private var messageTaskId = 0
    @State private var isReauthenticating = false

    var body: some View {
        NavigationStack {
            GlassChatView(
                chat: Binding(
                    get: { healthDataInterpreter.messages },
                    set: { healthDataInterpreter.messages = $0 }
                ),
                isInputEnabled: !healthDataInterpreter.isGenerating
            )
            .toolbar {
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
        .task(id: modelSettingRefreshId) {
            await healthDataInterpreter.prepareSession(model: openAIModel)
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
