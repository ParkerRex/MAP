import Foundation

public enum GitHubActionItemType: String, Codable, CaseIterable {
    case notification
    case pullRequest
    case task
}

public enum GitHubActionItemState: String, Codable, CaseIterable {
    case open
    case closed
    case merged
    case draft
    case blocked
    case pending
}

public struct GitHubActionItem: Codable, Identifiable {
    public var id: String
    public var type: GitHubActionItemType
    public var title: String
    public var repository: String?
    public var reason: String?
    public var url: String?
    public var updatedAt: String?
    public var state: GitHubActionItemState?

    public init(
        id: String,
        type: GitHubActionItemType,
        title: String,
        repository: String? = nil,
        reason: String? = nil,
        url: String? = nil,
        updatedAt: String? = nil,
        state: GitHubActionItemState? = nil
    ) {
        self.id = id
        self.type = type
        self.title = title
        self.repository = repository
        self.reason = reason
        self.url = url
        self.updatedAt = updatedAt
        self.state = state
    }
}

public struct GitHubActivitySnapshot: Codable {
    public var contributionsGraphUrl: String?
    public var actionItems: [GitHubActionItem]

    public init(contributionsGraphUrl: String? = nil, actionItems: [GitHubActionItem] = []) {
        self.contributionsGraphUrl = contributionsGraphUrl
        self.actionItems = actionItems
    }
}

public struct GitHubConnectionStatus: Codable {
    public var connected: Bool
    public var username: String?
    public var avatarUrl: String?
    public var profileUrl: String?
    public var lastSyncAt: String?

    public init(
        connected: Bool,
        username: String? = nil,
        avatarUrl: String? = nil,
        profileUrl: String? = nil,
        lastSyncAt: String? = nil
    ) {
        self.connected = connected
        self.username = username
        self.avatarUrl = avatarUrl
        self.profileUrl = profileUrl
        self.lastSyncAt = lastSyncAt
    }
}
