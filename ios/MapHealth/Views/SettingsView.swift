import MapHealthCore
import OSLog
import SpeziChat
import SpeziLLMOpenAI
import SpeziViews
import SwiftUI

struct SettingsView: View {
    @Environment(HealthDataInterpreter.self) private var healthDataInterpreter
    @Environment(\.dismiss) private var dismiss

    @AppStorage(StorageKeys.enableTextToSpeech) private var enableTextToSpeech = StorageKeys.Defaults.enableTextToSpeech
    @AppStorage(StorageKeys.onboardingFlowComplete) private var onboardingFlowComplete = false

    @State private var path = ManagedNavigationStack.Path()
    @State private var didComplete = false
    @State private var showSignOutAlert = false
    @Binding var modelSettingRefreshId: UUID

    var body: some View {
        ManagedNavigationStack(didComplete: self.$didComplete, path: self.path) {
            List {
                self.accountSection
                self.changeModelSettings
                self.chatSettings
                self.speechSettings
                self.disclaimer
            }
            .navigationTitle("SETTINGS_TITLE")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("SETTINGS_DONE") {
                        dismiss()
                    }
                }
            }
            .accessibilityIdentifier("settingsList")
        }
        .onChange(of: self.didComplete) { _, newValue in
            if newValue {
                self.modelSettingRefreshId = UUID()      // fresh refresh main view
                dismiss()
            }
        }
        .alert("Sign Out", isPresented: $showSignOutAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Sign Out", role: .destructive) {
                signOut()
            }
        } message: {
            Text("Are you sure you want to sign out? Your local data will be preserved.")
        }
    }

    private var accountSection: some View {
        Section("Account") {
            if MapAPIClient.shared.isAuthenticated {
                HStack {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Connected with Google")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Text("Signed in")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()
                }
                .padding(.vertical, 4)

                Button("Sign Out", role: .destructive) {
                    showSignOutAlert = true
                }
            } else {
                Text("Not signed in")
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var changeModelSettings: some View {
        Section("LLM Settings") {
            Button("Select Execution Type & Model") {
                self.path.append(customView: LLMSourceSelection())
            }
                .accessibilityIdentifier("changeModelButton")
        }
    }

    private var chatSettings: some View {
        Section("SETTINGS_CHAT") {
            Button("SETTINGS_CHAT_RESET") {
                Task {
                    await healthDataInterpreter.resetChat()
                    dismiss()
                }
            }
                .buttonStyle(PlainButtonStyle())
                .accessibilityIdentifier("resetButton")
        }
    }

    private var speechSettings: some View {
        Section("SETTINGS_SPEECH") {
            Toggle(isOn: $enableTextToSpeech) {
                Text("SETTINGS_SPEECH_TEXT_TO_SPEECH")
            }
        }
    }

    private var disclaimer: some View {
        Section("SETTINGS_DISCLAIMER_TITLE") {
            Text("SETTINGS_DISCLAIMER_TEXT")
        }
    }

    private func signOut() {
        // Clear auth token (preserves local data)
        MapAPIClient.shared.signOut()

        // Reset onboarding to show sign-in again
        onboardingFlowComplete = false

        dismiss()
    }
}

#if DEBUG
#Preview {
    SettingsView(modelSettingRefreshId: .constant(UUID()))
}
#endif
