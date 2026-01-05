import Foundation

@MainActor
public final class GitHubActivityService: ObservableObject {
    public static let shared = GitHubActivityService()

    @Published public private(set) var connectionStatus: GitHubConnectionStatus?
    @Published public private(set) var activity: GitHubActivitySnapshot?
    @Published public private(set) var isLoading = false
    @Published public private(set) var error: Error?
    @Published public private(set) var lastUpdated: Date?

    private let apiClient: MapAPIClient

    public init(apiClient: MapAPIClient = .shared) {
        self.apiClient = apiClient
    }

    public func refresh() async {
        guard apiClient.isAuthenticated else {
            reset()
            return
        }

        isLoading = true
        error = nil

        do {
            let status = try await apiClient.getGitHubConnectionStatus()
            connectionStatus = status

            if status.connected {
                activity = try await apiClient.getGitHubActivity()
            } else {
                activity = nil
            }

            lastUpdated = Date()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    public func disconnect() async throws {
        _ = try await apiClient.disconnectGitHub()
        await refresh()
    }

    public func handleSelection(_ item: GitHubActionItem) async {
        guard item.type == .notification else { return }
        do {
            _ = try await apiClient.markGitHubNotificationRead(threadId: item.id)
            await refresh()
        } catch {
            self.error = error
        }
    }

    public func reset() {
        connectionStatus = nil
        activity = nil
        error = nil
        isLoading = false
        lastUpdated = nil
    }
}
