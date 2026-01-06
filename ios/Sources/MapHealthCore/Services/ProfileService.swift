import Foundation

@MainActor
public final class ProfileService: ObservableObject {
    public static let shared = ProfileService()

    @Published public private(set) var profile: UserProfile?
    @Published public private(set) var isLoading = false
    @Published public private(set) var error: Error?

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
            profile = try await apiClient.getProfile()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    public func reset() {
        profile = nil
        error = nil
        isLoading = false
    }
}
