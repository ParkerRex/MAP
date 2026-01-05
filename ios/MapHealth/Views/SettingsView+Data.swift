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

    var normalizedGithubUsername: String {
        githubUsername
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "^@", with: "", options: .regularExpression)
    }

    var githubHasChanges: Bool {
        normalizedGithubUsername != savedGithubUsername
    }

    var llmSource: LLMSource {
        LLMSource(rawValue: llmSourceRaw) ?? .openai
    }

    @MainActor
    func loadProfile() async {
        guard MapAPIClient.shared.isAuthenticated else { return }

        isLoadingProfile = true
        do {
            let profile = try await MapAPIClient.shared.getProfile()
            userProfile = profile
            let savedUsername = profile.githubUsername?
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .replacingOccurrences(of: "^@", with: "", options: .regularExpression) ?? ""
            savedGithubUsername = savedUsername
            githubUsername = savedUsername
        } catch {
            let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.yourcompany.app", category: "Settings")
            logger.error("Failed to load profile: \(error.localizedDescription)")
        }
        isLoadingProfile = false
    }

    @MainActor
    func saveGithubUsername() async {
        guard MapAPIClient.shared.isAuthenticated else { return }
        guard githubHasChanges else { return }

        isSavingGithub = true
        githubError = nil
        do {
            let updated = try await MapAPIClient.shared.updateGithubUsername(
                normalizedGithubUsername.isEmpty ? nil : normalizedGithubUsername
            )
            userProfile = updated
            let savedUsername = updated.githubUsername?
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .replacingOccurrences(of: "^@", with: "", options: .regularExpression) ?? ""
            savedGithubUsername = savedUsername
            githubUsername = savedUsername
        } catch {
            githubError = "Could not update GitHub username."
        }
        isSavingGithub = false
    }

    func signOut() {
        MapAPIClient.shared.signOut()
        onboardingFlowComplete = false
        dismiss()
    }
}
