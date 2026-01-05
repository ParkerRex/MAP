import MapHealthCore
import OSLog
import SwiftUI

enum SettingsAppearanceMode: String, CaseIterable {
    case system
    case light
    case dark

    var title: String {
        switch self {
        case .system:
            return "System"
        case .light:
            return "Light"
        case .dark:
            return "Dark"
        }
    }
}

#if DEBUG
#Preview {
    SettingsView(modelSettingRefreshId: .constant(UUID()))
        .environmentObject(HealthDataInterpreter())
}
#endif
