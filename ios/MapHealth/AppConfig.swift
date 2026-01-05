import Foundation

enum AppConfig {
    static let webBaseURL: String = {
        #if DEBUG
        // Use Cloudflare Tunnel for device testing
        return "https://mapyourlife.org"
        #else
        return "https://app.map.ai"
        #endif
    }()
}

enum GitHubOAuth {
    static let callbackScheme = "maphealth"

    static func authURL(sessionToken: String?) -> URL {
        var components = URLComponents(string: "\(AppConfig.webBaseURL)/api/github/oauth")!
        var queryItems = [URLQueryItem(name: "platform", value: "ios")]
        if let sessionToken, !sessionToken.isEmpty {
            queryItems.append(URLQueryItem(name: "token", value: sessionToken))
        }
        components.queryItems = queryItems
        return components.url! // swiftlint:disable:this force_unwrapping
    }

    static func handleCallbackURL(_ callbackURL: URL) throws {
        guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
            throw GitHubOAuthError.invalidCallback("Invalid callback URL.")
        }

        if let error = components.queryItems?.first(where: { $0.name == "error" })?.value {
            throw GitHubOAuthError.authFailed(error)
        }
    }
}

enum GitHubOAuthError: LocalizedError {
    case invalidCallback(String)
    case authFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidCallback(let message):
            return message
        case .authFailed(let message):
            return message
        }
    }
}
