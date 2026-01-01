import Foundation

enum AppConfig {
    static let webBaseURL: String = {
        #if DEBUG
        // Use Mac's local IP for simulator/device testing
        return "http://10.0.0.202:3000"
        #else
        return "https://app.map.ai"
        #endif
    }()
}
