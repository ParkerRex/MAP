import MapHealthCore
import OSLog
import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var healthDataInterpreter: HealthDataInterpreter
    @Environment(\.dismiss) private var dismiss

    @AppStorage(StorageKeys.onboardingFlowComplete) private var onboardingFlowComplete = false
    @AppStorage(StorageKeys.openAIModel) private var openAIModel = StorageKeys.Defaults.openAIModel
    @AppStorage(StorageKeys.claudeModel) private var claudeModel = StorageKeys.Defaults.claudeModel
    @AppStorage(StorageKeys.llmSource) private var llmSourceRaw = StorageKeys.Defaults.llmSource

    @State private var showSignOutAlert = false
    @State private var userProfile: UserProfile?
    @State private var isLoadingProfile = false
    @Binding var modelSettingRefreshId: UUID
    @State private var showLLMSettings = false

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
        ScrollView {
            VStack(spacing: 24) {
                accountSection
                modelSection
                chatSection
                infoSection
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
    }

    private var accountSection: some View {
        settingsSection(
            title: "SETTINGS_ACCOUNT_TITLE",
            subtitle: MapAPIClient.shared.isAuthenticated ? "ACCOUNT_SIGNED_IN" : "ACCOUNT_NOT_SIGNED_IN"
        ) {
            if MapAPIClient.shared.isAuthenticated {
                HStack(spacing: 12) {
                    if let photoUrl = userProfile?.profilePhotoUrl,
                       let url = URL(string: photoUrl) {
                        AsyncImage(url: url) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            profilePlaceholder
                        }
                        .frame(width: 54, height: 54)
                        .clipShape(Circle())
                    } else {
                        profilePlaceholder
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        if isLoadingProfile {
                            Text("GENERIC_LOADING")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        } else if let profile = userProfile {
                            Text(profile.displayName ?? profile.email)
                                .font(.headline)
                            Text(profile.email)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else {
                            Text("ACCOUNT_CONNECTED_GOOGLE")
                                .font(.headline)
                            Text("ACCOUNT_SIGNED_IN")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()

                    statusPill(label: "Connected", color: .green)
                }

                Divider()

                Button {
                    showSignOutAlert = true
                } label: {
                    settingsRow(
                        icon: "rectangle.portrait.and.arrow.right",
                        iconTint: .red,
                        title: "SIGN_OUT_BUTTON",
                        subtitle: "SIGN_OUT_MESSAGE",
                        showsChevron: false
                    )
                }
                .buttonStyle(.plain)
            } else {
                settingsRow(
                    icon: "person.crop.circle.badge.exclamationmark",
                    iconTint: .orange,
                    title: "ACCOUNT_NOT_SIGNED_IN",
                    subtitle: "ACCOUNT_SIGNED_IN"
                )
            }
        }
    }

    private var profilePlaceholder: some View {
        Image(systemName: "person.circle.fill")
            .font(.system(size: 48))
            .foregroundStyle(.secondary)
    }

    private var modelSection: some View {
        settingsSection(
            title: "LLM_SETTINGS_TITLE",
            subtitle: "Choose the model that powers your chat."
        ) {
            settingsRow(
                icon: "sparkles",
                iconTint: .purple,
                title: "Active model",
                subtitle: currentModelDisplayName
            )

            Button {
                showLLMSettings = true
            } label: {
                settingsRow(
                    icon: "slider.horizontal.3",
                    iconTint: .accent,
                    title: "LLM_SETTINGS_SELECT_MODEL",
                    subtitle: "Switch providers and models"
                )
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("changeModelButton")
        }
    }

    private var chatSection: some View {
        settingsSection(
            title: "SETTINGS_CHAT",
            subtitle: "Manage your chat history and preferences."
        ) {
            Button {
                Task {
                    await healthDataInterpreter.resetChat()
                    dismiss()
                }
            } label: {
                settingsRow(
                    icon: "arrow.counterclockwise",
                    iconTint: .orange,
                    title: "SETTINGS_CHAT_RESET",
                    subtitle: "Clears your current conversation"
                )
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("resetButton")
        }
    }

    private var infoSection: some View {
        settingsSection(
            title: "SETTINGS_DISCLAIMER_TITLE",
            subtitle: "Your data is yours."
        ) {
            Text("SETTINGS_DISCLAIMER_TEXT")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            Divider()

            settingsRow(
                icon: "app.badge",
                iconTint: .secondary,
                title: "App version",
                subtitle: appVersion,
                showsChevron: false
            )
        }
    }

    private func settingsSection(
        title: String,
        subtitle: String,
        @ViewBuilder content: () -> some View
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.secondary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 12) {
                content()
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))
        }
    }

    private func settingsRow(
        icon: String,
        iconTint: Color,
        title: String,
        subtitle: String,
        showsChevron: Bool = true
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(iconTint)
                .frame(width: 28, height: 28)
                .background(iconTint.opacity(0.15), in: RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
        }
        .contentShape(Rectangle())
    }

    private func statusPill(label: String, color: Color) -> some View {
        Text(label)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12), in: Capsule())
    }

    private var currentModelDisplayName: String {
        switch llmSource {
        case .openai:
            return "OpenAI · \(openAIModel)"
        case .claude:
            return "Claude · \(claudeModel)"
        case .fog, .local:
            return "Local · \(openAIModel)"
        }
    }

    private var appVersion: String {
        let bundleVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "--"
        let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "--"
        return "\(bundleVersion) (\(buildNumber))"
    }

    private var llmSource: LLMSource {
        LLMSource(rawValue: llmSourceRaw) ?? .openai
    }

    @MainActor
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
