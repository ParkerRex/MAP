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
            subtitle: "Sync contributions, notifications, PRs, and tasks."
        ) {
            if MapAPIClient.shared.isAuthenticated {
                VStack(alignment: .leading, spacing: 12) {
                    if githubService.isLoading && githubService.connectionStatus == nil {
                        HStack(spacing: 12) {
                            ProgressView()
                            Text("Checking GitHub connection...")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    } else if let connection = githubService.connectionStatus, connection.connected {
                        githubConnectedRow(connection)
                    } else {
                        githubDisconnectedRow
                    }

                    if let githubSectionError {
                        Text(githubSectionError)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
            } else {
                settingsRow(
                    icon: "person.crop.circle.badge.exclamationmark",
                    iconTint: .orange,
                    title: "ACCOUNT_NOT_SIGNED_IN",
                    subtitle: "Sign in to connect GitHub.",
                    showsChevron: false
                )
            }
        }
    }

    private func githubConnectedRow(_ connection: GitHubConnectionStatus) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                if let avatarUrl = connection.avatarUrl,
                   let url = URL(string: avatarUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        githubAvatarPlaceholder
                    }
                    .frame(width: 44, height: 44)
                    .clipShape(Circle())
                } else {
                    githubAvatarPlaceholder
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(connection.username.map { "@\($0)" } ?? "GitHub connected")
                        .font(.subheadline.weight(.semibold))
                    Text("Your GitHub activity will appear on Home.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                statusPill(label: "Connected", color: .green)
            }

            HStack(spacing: 12) {
                Button {
                    Task {
                        await githubService.refresh()
                    }
                } label: {
                    Text("Refresh")
                        .frame(maxWidth: .infinity)
                }
                .mapHealthGlassButtonStyle()
                .disabled(githubService.isLoading)

                Button(role: .destructive) {
                    Task {
                        await disconnectGitHub()
                    }
                } label: {
                    Text("Disconnect")
                        .frame(maxWidth: .infinity)
                }
                .mapHealthGlassButtonStyle()
                .disabled(githubService.isLoading)
            }
        }
    }

    private var githubDisconnectedRow: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Connect GitHub to show contributions and review requests on Home.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Button {
                Task {
                    await connectGitHub()
                }
            } label: {
                Text(isConnectingGitHub ? "Connecting..." : "Connect GitHub")
                    .frame(maxWidth: .infinity)
            }
            .mapHealthGlassButtonStyle(prominent: true)
            .disabled(isConnectingGitHub)
        }
    }

    private var githubAvatarPlaceholder: some View {
        ZStack {
            Circle()
                .fill(Color.secondary.opacity(0.2))
                .frame(width: 44, height: 44)

            Image(systemName: "person.fill")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(.secondary)
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
