import MapHealthCore
import UIKit

class MapHealthAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        BackgroundSyncManager.shared.registerBackgroundTasks()
        return true
    }
}
