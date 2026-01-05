import MapHealthCore
import OSLog
import SwiftUI

extension SettingsView {
    var body: some View {
        NavigationStack {
            settingsContainer
                .scrollContentBackground(.hidden)
                .navigationTitle("SETTINGS_TITLE")
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("SETTINGS_DONE") {
                            dismiss()
                        }
                        .mapHealthGlassButtonStyle(prominent: true)
                    }
                }
                .accessibilityIdentifier("settingsList")
                .task {
                    async let profileTask: () = loadProfile()
                    async let githubTask: () = githubService.refresh()
                    _ = await (profileTask, githubTask)
                }
        }
        .background(OnboardingBackground())
        .alert("SIGN_OUT_TITLE", isPresented: $showSignOutAlert) {
            Button("ALERT_CANCEL", role: .cancel) {}
            Button("SIGN_OUT_BUTTON", role: .destructive) {
                signOut()
            }
        } message: {
            Text("SIGN_OUT_MESSAGE")
        }
        .sheet(isPresented: $showLLMSettings, onDismiss: {
            self.modelSettingRefreshId = UUID()
        }, content: {
            LLMSettingsFlow()
        })
    }

    @ViewBuilder
    private var settingsContainer: some View {
        if #available(iOS 26, *) {
            GlassEffectContainer(spacing: 16) {
                settingsList
            }
        } else {
            settingsList
        }
    }

    private var settingsList: some View {
        ScrollView {
            VStack(spacing: 24) {
                accountSection
                githubSection
                modelSection
                appearanceSection
                infoSection
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
    }
}
