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
