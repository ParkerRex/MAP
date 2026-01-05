import MapHealthCore
import OSLog
import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var healthDataInterpreter: HealthDataInterpreter
    @Environment(\.dismiss) var dismiss

    @AppStorage(StorageKeys.onboardingFlowComplete) var onboardingFlowComplete = false
    @AppStorage(StorageKeys.openAIModel) var openAIModel = StorageKeys.Defaults.openAIModel
    @AppStorage(StorageKeys.claudeModel) var claudeModel = StorageKeys.Defaults.claudeModel
    @AppStorage(StorageKeys.llmSource) var llmSourceRaw = StorageKeys.Defaults.llmSource
    @AppStorage(StorageKeys.appearanceMode) var appearanceModeRaw = StorageKeys.Defaults.appearanceMode

    @State var showSignOutAlert = false
    @State var userProfile: UserProfile?
    @State var isLoadingProfile = false
    @State var githubUsername = ""
    @State var savedGithubUsername = ""
    @State var isSavingGithub = false
    @State var githubError: String?
    @Binding var modelSettingRefreshId: UUID
    @State var showLLMSettings = false
}
