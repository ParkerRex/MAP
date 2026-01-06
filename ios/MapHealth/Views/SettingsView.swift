import MapHealthCore
import OSLog
import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.webAuthenticationSession) var webAuthSession

    @AppStorage(StorageKeys.onboardingFlowComplete) var onboardingFlowComplete = false
    @AppStorage(StorageKeys.openAIModel) var openAIModel = StorageKeys.Defaults.openAIModel
    @AppStorage(StorageKeys.claudeModel) var claudeModel = StorageKeys.Defaults.claudeModel
    @AppStorage(StorageKeys.llmSource) var llmSourceRaw = StorageKeys.Defaults.llmSource
    @AppStorage(StorageKeys.appearanceMode) var appearanceModeRaw = StorageKeys.Defaults.appearanceMode

    @State var showSignOutAlert = false
    @StateObject var profileService = ProfileService.shared
    @StateObject var githubService = GitHubActivityService.shared
    @State var isConnectingGitHub = false
    @State var githubConnectError: String?
    @Binding var modelSettingRefreshId: UUID
    @State var showLLMSettings = false
}
