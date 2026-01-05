import AuthenticationServices
import MapHealthCore
import OSLog
import SwiftUI

extension SettingsView {
    var currentModelDisplayName: String {
        switch llmSource {
        case .openai:
            return "OpenAI · \(LLMModelCatalog.displayName(for: openAIModel, source: .openai))"
        case .claude:
            return "Claude · \(LLMModelCatalog.displayName(for: claudeModel, source: .claude))"
        case .fog, .local:
            return "Local · \(LLMModelCatalog.displayName(for: openAIModel, source: .openai))"
        }
    }

    var appVersion: String {
        let bundleVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "--"
        let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "--"
        return "\(bundleVersion) (\(buildNumber))"
    }

    var llmSource: LLMSource {
        LLMSource(rawValue: llmSourceRaw) ?? .openai
    }

    var githubSectionError: String? {
        githubConnectError ?? githubService.error?.localizedDescription
    }

    @MainActor
    func loadProfile() async {
        guard MapAPIClient.shared.isAuthenticated else { return }

        isLoadingProfile = true
        do {
            let profile = try await MapAPIClient.shared.getProfile()
            userProfile = profile
        } catch {
            let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.yourcompany.app", category: "Settings")
            logger.error("Failed to load profile: \(error.localizedDescription)")
        }
        isLoadingProfile = false
    }

    @MainActor
    func connectGitHub() async {
        guard !isConnectingGitHub else { return }
        isConnectingGitHub = true
        githubConnectError = nil
        defer { isConnectingGitHub = false }

        do {
            guard let sessionToken = KeychainService.shared.getSessionToken(), !sessionToken.isEmpty else {
                githubConnectError = "Please sign in again to connect GitHub."
                return
            }
            let callbackURL = try await webAuthSession.authenticate(
                using: GitHubOAuth.authURL(sessionToken: sessionToken),
                callbackURLScheme: GitHubOAuth.callbackScheme,
                preferredBrowserSession: .shared
            )
            try GitHubOAuth.handleCallbackURL(callbackURL)
            await githubService.refresh()
        } catch ASWebAuthenticationSessionError.canceledLogin {
            return
        } catch {
            githubConnectError = error.localizedDescription
        }
    }

    @MainActor
    func disconnectGitHub() async {
        do {
            try await githubService.disconnect()
        } catch {
            githubConnectError = error.localizedDescription
        }
    }

    func signOut() {
        MapAPIClient.shared.signOut()
        githubService.reset()
        onboardingFlowComplete = false
        dismiss()
    }
}
