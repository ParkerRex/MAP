import MapHealthCore
import OSLog
import SwiftUI

extension SettingsView {
    var accountSection: some View {
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

    var githubSection: some View {
        settingsSection(
            title: "GitHub",
            subtitle: "Show your contribution graph on Home."
        ) {
            if MapAPIClient.shared.isAuthenticated {
                VStack(alignment: .leading, spacing: 12) {
                    Text("GitHub username")
                        .font(.subheadline.weight(.semibold))

                    HStack(spacing: 8) {
                        Text("@")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        TextField(
                            "octocat",
                            text: Binding(
                                get: { githubUsername },
                                set: { newValue in
                                    githubError = nil
                                    let sanitized = newValue.replacingOccurrences(
                                        of: "^@+",
                                        with: "",
                                        options: .regularExpression
                                    )
                                    githubUsername = sanitized
                                }
                            )
                        )
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    }
                    .padding(12)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                    Button {
                        Task {
                            await saveGithubUsername()
                        }
                    } label: {
                        Text(isSavingGithub ? "Saving..." : "Save")
                            .frame(maxWidth: .infinity)
                    }
                    .mapHealthGlassButtonStyle(prominent: true)
                    .disabled(!githubHasChanges || isSavingGithub)

                    if let githubError {
                        Text(githubError)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    if !normalizedGithubUsername.isEmpty {
                        GitHubContributionCard(username: normalizedGithubUsername)
                    } else {
                        Text("Add your username to show the contribution graph.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                settingsRow(
                    icon: "person.crop.circle.badge.exclamationmark",
                    iconTint: .orange,
                    title: "ACCOUNT_NOT_SIGNED_IN",
                    subtitle: "Sign in to add your GitHub username.",
                    showsChevron: false
                )
            }
        }
    }

    private var profilePlaceholder: some View {
        Image(systemName: "person.circle.fill")
            .font(.system(size: 48))
            .foregroundStyle(.secondary)
    }

    var modelSection: some View {
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

    var chatSection: some View {
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

    var appearanceSection: some View {
        settingsSection(
            title: "Appearance",
            subtitle: "Choose how Map Health looks."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                Picker("Appearance", selection: $appearanceModeRaw) {
                    ForEach(SettingsAppearanceMode.allCases, id: \.rawValue) { mode in
                        Text(mode.title).tag(mode.rawValue)
                    }
                }
                .pickerStyle(.segmented)

                Text("System follows your device setting.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    var infoSection: some View {
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
}
