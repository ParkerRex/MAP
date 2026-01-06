import Foundation

@MainActor
public final class SessionService: ObservableObject {
    public static let shared = SessionService()

    @Published public private(set) var token: String?

    public var isAuthenticated: Bool {
        token != nil
    }

    private let apiClient: MapAPIClient
    private let keychain: KeychainService

    public init(
        apiClient: MapAPIClient = .shared,
        keychain: KeychainService = .shared
    ) {
        self.apiClient = apiClient
        self.keychain = keychain
        let existingToken = keychain.getSessionToken()
        token = existingToken
        if let existingToken {
            apiClient.setAuthToken(existingToken)
        }
    }

    public func setSessionToken(_ token: String) throws {
        try keychain.saveSessionToken(token)
        self.token = token
        apiClient.setAuthToken(token)
    }

    public func signOut() {
        token = nil
        apiClient.clearAuthToken()
    }
}
