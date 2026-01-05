import MapHealthCore
import SwiftUI

struct GitHubActivityCard: View {
    let connectionStatus: GitHubConnectionStatus?
    let activity: GitHubActivitySnapshot?
    let isLoading: Bool
    let errorMessage: String?
    let isConnecting: Bool
    let onConnect: () -> Void
    let onRetry: () -> Void
    let onSelectItem: (GitHubActionItem) -> Void

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

            GitHubContributionGraphView(
                weeks: activity?.contributionWeeks ?? [],
                totalContributions: activity?.totalContributions
            )

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
                GitHubActionRow(item: item, onSelect: onSelectItem)
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
    let onSelect: (GitHubActionItem) -> Void
    @Environment(\.openURL) private var openURL
    @State private var isMarkingRead = false

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
            Button {
                withAnimation(.easeOut(duration: 0.15)) {
                    isMarkingRead = true
                }
                onSelect(item)
                openURL(destinationURL)
            } label: {
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
        .scaleEffect(isMarkingRead ? 0.98 : 1.0)
        .opacity(isMarkingRead ? 0.7 : 1.0)
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
    let weeks: [GitHubContributionWeek]
    let totalContributions: Int?

    private let cellSize: CGFloat = 10
    private let cellSpacing: CGFloat = 3
    private let weekdayLabels: [Int: String] = [
        1: "Mon",
        3: "Wed",
        5: "Fri"
    ]

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.primary.opacity(0.08), lineWidth: 1)
                )

            if weeks.isEmpty {
                VStack(spacing: 4) {
                    Text("Contributions graph")
                        .font(.subheadline.weight(.semibold))
                    Text("Connect to load your GitHub history.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(12)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    if let totalContributions {
                        Text("\(totalContributions) contributions in the last year")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    HStack(alignment: .top, spacing: 8) {
                        VStack(alignment: .leading, spacing: cellSpacing) {
                            ForEach(0..<7, id: \.self) { index in
                                Text(weekdayLabels[index] ?? "")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .frame(width: 28, height: cellSize, alignment: .leading)
                            }
                        }

                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyHStack(alignment: .top, spacing: cellSpacing) {
                                ForEach(weeks) { week in
                                    VStack(spacing: cellSpacing) {
                                        ForEach(week.days) { day in
                                            RoundedRectangle(cornerRadius: 2, style: .continuous)
                                                .fill(Color(hex: day.color) ?? Color.primary.opacity(0.12))
                                                .frame(width: cellSize, height: cellSize)
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 2, style: .continuous)
                                                        .stroke(Color.primary.opacity(0.06), lineWidth: 0.5)
                                                )
                                                .accessibilityLabel(day.accessibilityLabel)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.vertical, 2)

                    GitHubContributionLegend()
                }
                .padding(12)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

private struct GitHubContributionLegend: View {
    private let colors = [
        "#ebedf0",
        "#9be9a8",
        "#40c463",
        "#30a14e",
        "#216e39"
    ]

    var body: some View {
        HStack(spacing: 6) {
            Text("Less")
                .font(.caption2)
                .foregroundStyle(.secondary)

            HStack(spacing: 3) {
                ForEach(colors, id: \.self) { hex in
                    RoundedRectangle(cornerRadius: 2, style: .continuous)
                        .fill(Color(hex: hex) ?? Color.primary.opacity(0.12))
                        .frame(width: 10, height: 10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 2, style: .continuous)
                                .stroke(Color.primary.opacity(0.06), lineWidth: 0.5)
                        )
                }
            }

            Text("More")
                .font(.caption2)
                .foregroundStyle(.secondary)

            Spacer()
        }
    }
}

private extension GitHubContributionDay {
    var accessibilityLabel: String {
        let countText = count == 1 ? "1 contribution" : "\(count) contributions"
        return "\(countText) on \(date)"
    }
}


#if DEBUG
#Preview {
    let sampleWeeks = (0..<12).map { weekIndex in
        GitHubContributionWeek(days: (0..<7).map { dayIndex in
            let colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]
            return GitHubContributionDay(
                date: "2025-12-\(String(format: "%02d", weekIndex * 7 + dayIndex + 1))",
                count: (weekIndex + dayIndex) % 5,
                color: colors[(weekIndex + dayIndex) % colors.count],
                weekday: dayIndex
            )
        })
    }

    GitHubActivityCard(
        connectionStatus: GitHubConnectionStatus(
            connected: true,
            username: "octocat",
            avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
            profileUrl: "https://github.com/octocat"
        ),
        activity: GitHubActivitySnapshot(
            contributionsGraphUrl: "https://github.com/users/octocat/contributions",
            contributionWeeks: sampleWeeks,
            totalContributions: 734,
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
        onRetry: {},
        onSelectItem: { _ in }
    )
    .padding()
}
#endif
