import MapHealthCore
import OSLog
import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var healthDataInterpreter: HealthDataInterpreter
    @Environment(\.dismiss) private var dismiss

    @AppStorage(StorageKeys.onboardingFlowComplete) private var onboardingFlowComplete = false

    @State private var showSignOutAlert = false
    @State private var userProfile: UserProfile?
    @State private var isLoadingProfile = false
    @Binding var modelSettingRefreshId: UUID
    @State private var showLLMSettings = false
    @Namespace private var settingsNamespace

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
                    await loadProfile()
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
        List {
            self.accountSection
            self.changeModelSettings
            self.chatSettings
            self.disclaimer
        }
    }

    private var accountSection: some View {
        Section("SETTINGS_ACCOUNT_TITLE") {
            if MapAPIClient.shared.isAuthenticated {
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        // Profile photo or placeholder
                        if let photoUrl = userProfile?.profilePhotoUrl,
                           let url = URL(string: photoUrl) {
                            AsyncImage(url: url) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                profilePlaceholder
                            }
                            .frame(width: 48, height: 48)
                            .clipShape(Circle())
                        } else {
                            profilePlaceholder
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            if isLoadingProfile {
                                Text("GENERIC_LOADING")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            } else if let profile = userProfile {
                                Text(profile.displayName ?? profile.email)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text(profile.email)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            } else {
                                Text("ACCOUNT_CONNECTED_GOOGLE")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text("ACCOUNT_SIGNED_IN")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Spacer()
                    }

                    Button("SIGN_OUT_BUTTON", role: .destructive) {
                        showSignOutAlert = true
                    }
                    .mapHealthGlassButtonStyle()
                }
                .padding(12)
                .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))
                .listRowBackground(Color.clear)
            } else {
                Text("ACCOUNT_NOT_SIGNED_IN")
                    .foregroundStyle(.secondary)
                    .padding(12)
                    .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))
                    .listRowBackground(Color.clear)
            }
        }
    }

    private var profilePlaceholder: some View {
        Image(systemName: "person.circle.fill")
            .font(.system(size: 48))
            .foregroundStyle(.secondary)
    }

    private var changeModelSettings: some View {
        Section("LLM_SETTINGS_TITLE") {
            Button("LLM_SETTINGS_SELECT_MODEL") {
                showLLMSettings = true
            }
            .mapHealthGlassButtonStyle()
                .accessibilityIdentifier("changeModelButton")
            .listRowBackground(Color.clear)
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
            .mapHealthGlassButtonStyle()
            .accessibilityIdentifier("resetButton")
            .listRowBackground(Color.clear)
        }
    }

    private var disclaimer: some View {
        Section("SETTINGS_DISCLAIMER_TITLE") {
            Text("SETTINGS_DISCLAIMER_TEXT")
                .padding(12)
                .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
                .listRowBackground(Color.clear)
        }
    }

    private func loadProfile() async {
        guard MapAPIClient.shared.isAuthenticated else { return }

        isLoadingProfile = true
        do {
            userProfile = try await MapAPIClient.shared.getProfile()
        } catch {
            // Profile fetch failed, show fallback UI
            let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.yourcompany.app", category: "Settings")
            logger.error("Failed to load profile: \(error.localizedDescription)")
        }
        isLoadingProfile = false
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
        .environmentObject(HealthDataInterpreter())
}
#endif
