import HealthKit
import MapHealthCore
import Spezi
import SpeziHealthKit
import SpeziKeychainStorage
import SpeziLLM
import SpeziLLMFog
import SpeziLLMLocal
import SpeziLLMOpenAI
import SpeziSpeechSynthesizer
import SwiftUI

class MapHealthAppDelegate: SpeziAppDelegate {
    override var configuration: Configuration {
        Configuration(standard: MapHealthStandard()) {
            if HKHealthStore.isHealthDataAvailable() {
                self.healthKit
            }
            LLMRunner {
                LLMOpenAIPlatform(
                    configuration: .init(
                        authToken: .keychain(tag: .openAIKey, username: "com.map.health")
                    )
                )
                LLMFogPlatform(configuration: .init(host: "spezillmfog.local", connectionType: .http, authToken: .none))
                LLMLocalPlatform()
                LLMMockPlatform()
            }
            HealthDataInterpreter()
            HealthDataFetcher()
            KeychainStorage()
        }
    }

    private var healthKit: HealthKit {
        HealthKit {
            RequestReadAccess(
                quantity: [
                    // Activity
                    .stepCount,
                    .distanceWalkingRunning,
                    .distanceCycling,
                    .flightsClimbed,
                    .activeEnergyBurned,
                    .basalEnergyBurned,
                    .appleExerciseTime,
                    .appleStandTime,

                    // Heart & Recovery
                    .heartRate,
                    .restingHeartRate,
                    .walkingHeartRateAverage,
                    .heartRateVariabilitySDNN,
                    .vo2Max,
                    .bloodOxygen,

                    // Body
                    .bodyMass,
                    .bodyFatPercentage,
                    .leanBodyMass,
                    .bodyMassIndex,
                    .height,

                    // Sleep-related
                    .respiratoryRate
                ]
            )
            RequestReadAccess(category: [.sleepAnalysis, .mindfulSession])
        }
    }
}
