import MapHealthCore
import Spezi
import SpeziHealthKit
import SwiftUI

actor MapHealthStandard: Standard, HealthKitConstraint {
    func handleNewSamples<Sample>(
        _ addedSamples: some Collection<Sample>,
        ofType sampleType: SampleType<Sample>
    ) async {
        // Trigger background sync when significant new data arrives
        if addedSamples.count > 0 {
            Task {
                try? await BackgroundSyncManager.shared.performSync()
            }
        }
    }

    func handleDeletedObjects<Sample>(
        _ deletedObjects: some Collection<HKDeletedObject>,
        ofType sampleType: SampleType<Sample>
    ) async { }
}
