import MapHealthCore
import SwiftUI
import WebKit

struct GitHubActivityCard: View {
    let connectionStatus: GitHubConnectionStatus?
    let activity: GitHubActivitySnapshot?
    let isLoading: Bool
    let errorMessage: String?
    let isConnecting: Bool
    let onConnect: () -> Void
    let onRetry: () -> Void

    private var isConnected: Bool {
        connectionStatus?.connected == true
    }

    private var username: String? {
        connectionStatus?.username?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "^@", with: "", options: .regularExpression)
    }

    private var avatarURL: URL? {
        guard let avatarUrl = connectionStatus?.avatarUrl else { return nil }
        return URL(string: avatarUrl)
    }

    private var contributionsURL: URL? {
        if let urlString = activity?.contributionsGraphUrl,
           let url = URL(string: urlString) {
            return url
        }

        guard let username else { return nil }
        return URL(string: "https://github.com/users/\(username)/contributions")
    }

    private var actionItems: [GitHubActionItem] {
        activity?.actionItems ?? []
    }

    private var notificationCount: Int {
        actionItems.filter { $0.type == .notification }.count
    }

    private var pullRequestCount: Int {
        actionItems.filter { $0.type == .pullRequest }.count
    }

    private var taskCount: Int {
        actionItems.filter { $0.type == .task }.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            headerRow

            if let errorMessage {
                errorRow(errorMessage)
            } else if isLoading {
                loadingState
            } else if isConnected {
                connectedContent
            } else {
                disconnectedContent
            }
        }
        .mapHealthGlassCard(tint: Color.primary.opacity(0.03))
    }

    private var headerRow: some View {
        HStack(spacing: 10) {
            Image(systemName: "chevron.left.forwardslash.chevron.right")
                .font(.system(size: 16, weight: .semibold))

            Text("GitHub activity")
                .font(.headline)

            Spacer()

            statusPill(
                label: isConnected ? "Connected" : "Not connected",
                color: isConnected ? .green : .secondary
            )
        }
    }

    private var loadingState: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Circle()
                    .fill(Color.secondary.opacity(0.2))
                    .frame(width: 40, height: 40)

                VStack(alignment: .leading, spacing: 6) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.secondary.opacity(0.2))
                        .frame(width: 120, height: 12)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.secondary.opacity(0.15))
                        .frame(width: 80, height: 10)
                }
            }

            RoundedRectangle(cornerRadius: 12)
                .fill(Color.secondary.opacity(0.12))
                .frame(height: 96)

            HStack(spacing: 8) {
                ForEach(0..<3, id: \.self) { _ in
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.secondary.opacity(0.15))
                        .frame(height: 34)
                }
            }
        }
        .shimmer()
    }

    private var disconnectedContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Connect GitHub to sync contributions, notifications, PRs, and tasks.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Button(action: onConnect) {
                Text(isConnecting ? "Connecting..." : "Connect GitHub")
                    .frame(maxWidth: .infinity)
            }
            .mapHealthGlassButtonStyle(prominent: true)
            .disabled(isConnecting)
        }
    }

    private var connectedContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            userRow

            GitHubContributionGraphView(contributionsURL: contributionsURL)
                .frame(height: 104)

            if actionItems.isEmpty {
                emptyActionState
            } else {
                actionSummary
                actionList
            }
        }
    }

    private var userRow: some View {
        HStack(spacing: 12) {
            if let avatarURL {
                AsyncImage(url: avatarURL) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    avatarPlaceholder
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
            } else {
                avatarPlaceholder
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(username.map { "@\($0)" } ?? "GitHub connected")
                    .font(.subheadline.weight(.semibold))
                Text("Your activity syncs automatically.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
    }

    private var avatarPlaceholder: some View {
        ZStack {
            Circle()
                .fill(Color.primary.opacity(0.1))
                .frame(width: 40, height: 40)

            Image(systemName: "person.fill")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(.secondary)
        }
    }

    private var actionSummary: some View {
        HStack(spacing: 8) {
            summaryBadge(title: "Notifications", count: notificationCount, color: .blue, icon: "bell.fill")
            summaryBadge(title: "PRs", count: pullRequestCount, color: .purple, icon: "arrow.triangle.branch")
            summaryBadge(title: "Tasks", count: taskCount, color: .orange, icon: "checkmark.circle.fill")
        }
    }

    private var actionList: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(actionItems.prefix(4)) { item in
                GitHubActionRow(item: item)
            }

            if actionItems.count > 4 {
                Text("+\(actionItems.count - 4) more to review")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(
            Color.primary.opacity(0.03),
            in: RoundedRectangle(cornerRadius: 14, style: .continuous)
        )
    }

    private var emptyActionState: some View {
        HStack(spacing: 10) {
            Image(systemName: "checkmark.seal")
                .foregroundStyle(.green.opacity(0.6))
            VStack(alignment: .leading, spacing: 2) {
                Text("All caught up")
                    .font(.subheadline.weight(.semibold))
                Text("No GitHub tasks need your attention.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            Color.primary.opacity(0.03),
            in: RoundedRectangle(cornerRadius: 14, style: .continuous)
        )
    }

    private func summaryBadge(title: String, count: Int, color: Color, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(color)
            Text("\(count)")
                .font(.subheadline.weight(.semibold))
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity)
        .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func statusPill(label: String, color: Color) -> some View {
        Text(label)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12), in: Capsule())
    }

    private func errorRow(_ message: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Spacer()

            Button("Retry", action: onRetry)
                .font(.caption.weight(.semibold))
        }
        .padding(.vertical, 4)
    }
}

private struct GitHubActionRow: View {
    let item: GitHubActionItem

    private var destinationURL: URL? {
        guard let urlString = item.url else { return nil }
        return URL(string: urlString)
    }

    private var icon: String {
        switch item.type {
        case .notification:
            return "bell.fill"
        case .pullRequest:
            return "arrow.triangle.branch"
        case .task:
            return "checkmark.circle.fill"
        }
    }

    private var tint: Color {
        switch item.type {
        case .notification:
            return .blue
        case .pullRequest:
            return .purple
        case .task:
            return .orange
        }
    }

    private var subtitle: String? {
        var parts: [String] = []
        if let repository = item.repository, !repository.isEmpty {
            parts.append(repository)
        }
        if let reason = item.reason, !reason.isEmpty {
            parts.append(reason)
        }
        return parts.isEmpty ? nil : parts.joined(separator: " - ")
    }

    var body: some View {
        if let destinationURL {
            Link(destination: destinationURL) {
                rowContent
            }
            .buttonStyle(.plain)
        } else {
            rowContent
        }
    }

    private var rowContent: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 28, height: 28)
                .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)

                if let subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            if let state = item.state {
                statePill(state)
            }

            if destinationURL != nil {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
        }
    }

    private func statePill(_ state: GitHubActionItemState) -> some View {
        let label: String
        let color: Color

        switch state {
        case .open:
            label = "Open"
            color = .blue
        case .closed:
            label = "Closed"
            color = .secondary
        case .merged:
            label = "Merged"
            color = .purple
        case .draft:
            label = "Draft"
            color = .orange
        case .blocked:
            label = "Blocked"
            color = .red
        case .pending:
            label = "Pending"
            color = .secondary
        }

        return Text(label)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 6)
            .padding(.vertical, 4)
            .background(color.opacity(0.12), in: Capsule())
    }
}

private struct GitHubContributionGraphView: View {
    let contributionsURL: URL?

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.primary.opacity(0.08), lineWidth: 1)
                )

            if let contributionsURL {
                GitHubContributionWebView(contributionsURL: contributionsURL)
                    .padding(12)
            } else {
                VStack(spacing: 4) {
                    Text("Contributions graph")
                        .font(.subheadline.weight(.semibold))
                    Text("Connect to load your GitHub history.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct GitHubContributionWebView: UIViewRepresentable {
    let contributionsURL: URL

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = false
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.isUserInteractionEnabled = false
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.lastURL != contributionsURL else { return }
        context.coordinator.lastURL = contributionsURL
        var request = URLRequest(url: contributionsURL)
        request.setValue("image/svg+xml", forHTTPHeaderField: "Accept")
        webView.load(request)
    }

    final class Coordinator {
        var lastURL: URL?
    }
}

#if DEBUG
#Preview {
    GitHubActivityCard(
        connectionStatus: GitHubConnectionStatus(
            connected: true,
            username: "octocat",
            avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
            profileUrl: "https://github.com/octocat"
        ),
        activity: GitHubActivitySnapshot(
            contributionsGraphUrl: "https://github.com/users/octocat/contributions",
            actionItems: [
                GitHubActionItem(
                    id: "1",
                    type: .notification,
                    title: "Review requested on new onboarding flow",
                    repository: "map-ai/ios",
                    reason: "Review requested"
                ),
                GitHubActionItem(
                    id: "2",
                    type: .pullRequest,
                    title: "Fix calendar sync edge case",
                    repository: "map-ai/backend",
                    reason: "Draft",
                    state: .draft
                ),
                GitHubActionItem(
                    id: "3",
                    type: .task,
                    title: "Respond to issue #1421",
                    repository: "map-ai/web",
                    reason: "Assigned"
                )
            ]
        ),
        isLoading: false,
        errorMessage: nil,
        isConnecting: false,
        onConnect: {},
        onRetry: {}
    )
    .padding()
}
#endif
