# iOS Architecture

## Overview

The Map Health iOS app uses a two-module architecture:

- **MapHealthCore** - Pure Swift library containing business logic
- **MapHealthApp** - Thin SwiftUI app shell

This separation enables:
- Unit testing without iOS simulator
- Code reuse across platforms (iOS, macOS, watchOS)
- Faster CI builds
- Better testability through dependency injection

## Module Structure

```
ios/
├── Package.swift                    # SPM manifest
├── Sources/
│   ├── MapHealthCore/              # Business logic library
│   │   ├── Models/
│   │   │   ├── HealthData.swift         # Health metrics model
│   │   │   └── LLMSource.swift          # LLM provider enum
│   │   ├── Services/
│   │   │   ├── MapAPIClient.swift       # Backend sync client
│   │   │   └── BackgroundSync.swift     # Background task manager
│   │   ├── HealthKit/
│   │   │   ├── HealthDataFetcher.swift  # HealthKit queries
│   │   │   ├── HealthDataFetcher+Process.swift
│   │   │   ├── HealthDataFetcherError.swift
│   │   │   ├── HealthDataInterpreter.swift  # LLM context builder
│   │   │   └── PromptGenerator.swift    # System prompt builder
│   │   ├── Helpers/
│   │   │   ├── Date+Extensions.swift
│   │   │   ├── Binding+Negate.swift
│   │   │   ├── CodableArray+RawRepresentable.swift
│   │   │   └── String+ModuleLocalized.swift
│   │   └── SharedContext/
│   │       ├── StorageKeys.swift        # AppStorage keys
│   │       └── FeatureFlags.swift       # Command-line flags
│   │
│   └── MapHealthApp/               # SwiftUI app
│       ├── MapHealthApp.swift           # @main entry point
│       ├── MapHealthAppDelegate.swift   # Spezi configuration
│       ├── MapHealthStandard.swift      # HealthKit handler
│       ├── MapHealthTestingSetup.swift  # Test configuration
│       ├── Views/
│       │   ├── HealthChatView.swift     # Main chat UI
│       │   └── SettingsView.swift
│       ├── Onboarding/
│       │   ├── OnboardingFlow.swift
│       │   ├── Welcome.swift
│       │   ├── Disclaimer.swift
│       │   ├── LLMSourceSelection.swift
│       │   ├── HealthKitPermissions.swift
│       │   ├── OpenAI/
│       │   ├── Local/
│       │   └── Fog/
│       └── Resources/
│           └── Localizable.xcstrings
│
├── Tests/
│   └── MapHealthCoreTests/
│       └── PromptGeneratorTests.swift
│
└── MapHealth.xcodeproj/            # For device builds & signing
```

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Apple Health  │────▶│ HealthDataFetcher │────▶│   HealthData    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                        ┌──────────────────┐              │
                        │  PromptGenerator │◀─────────────┘
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │HealthDataInterpreter│
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   LLM Session    │────▶│  HealthChatView │
                        └──────────────────┘     └─────────────────┘
```

## Key Classes

### HealthDataFetcher

Spezi `Module` that queries HealthKit for health metrics.

```swift
@Observable
public class HealthDataFetcher: DefaultInitializable, Module, EnvironmentAccessible {
    public func fetchLastTwoWeeksStepCount() async throws -> [Double]
    public func fetchLastTwoWeeksSleep() async throws -> [Double]
    public func fetchAndProcessHealthData() async -> [HealthData]
}
```

### HealthDataInterpreter

Builds LLM context with health data and manages chat sessions.

```swift
@Observable
public class HealthDataInterpreter: DefaultInitializable, Module, EnvironmentAccessible {
    @Dependency(LLMRunner.self) private var llmRunner
    @Dependency(HealthDataFetcher.self) private var healthDataFetcher

    public var llm: (any LLMSession)?

    public func prepareLLM(with schema: any LLMSchema) async throws
    public func queryLLM() async throws
    public func resetChat() async
}
```

### MapAPIClient

HTTP client for syncing health data to the backend.

```swift
public class MapAPIClient {
    public static let shared = MapAPIClient()

    public func syncHealthData(_ healthData: [HealthData]) async throws -> SyncResponse
    public func getHealthStatus() async throws -> HealthConnectionStatus
}
```

### BackgroundSyncManager

Manages iOS background tasks for automatic data sync.

```swift
public class BackgroundSyncManager {
    public static let shared = BackgroundSyncManager()
    public static let taskIdentifier = "com.map.health.sync"

    public func registerBackgroundTasks()
    public func scheduleBackgroundSync()
    public func performSync() async throws
    public func enableBackgroundDelivery()
}
```

## Spezi Framework

The app uses [Stanford's Spezi framework](https://github.com/StanfordSpezi/Spezi) for:

- **Module system** - Dependency injection via `@Dependency`
- **HealthKit abstraction** - Simplified health data access
- **LLM orchestration** - Multiple LLM provider support
- **Onboarding flows** - Step-by-step user setup

### Configuration (MapHealthAppDelegate)

```swift
class MapHealthAppDelegate: SpeziAppDelegate {
    override var configuration: Configuration {
        Configuration(standard: MapHealthStandard()) {
            HealthKit { ... }
            LLMRunner {
                LLMOpenAIPlatform(...)
                LLMFogPlatform(...)
                LLMLocalPlatform()
            }
            HealthDataInterpreter()
            HealthDataFetcher()
            KeychainStorage()
        }
    }
}
```

## Design Patterns

### Observable Pattern

All Spezi modules use `@Observable` macro for SwiftUI reactivity:

```swift
@Observable
public class HealthDataFetcher { ... }
```

### Dependency Injection

Spezi's `@Dependency` macro provides compile-time safe DI:

```swift
@ObservationIgnored @Dependency(LLMRunner.self) private var llmRunner
@ObservationIgnored @Dependency(HealthDataFetcher.self) private var healthDataFetcher
```

### Environment Access

Modules are accessible via SwiftUI environment:

```swift
@Environment(HealthDataInterpreter.self) private var healthDataInterpreter
```

### Feature Flags

Command-line arguments control app behavior:

```swift
public enum FeatureFlags {
    public static let skipOnboarding = CommandLine.arguments.contains("--skipOnboarding")
    public static let mockMode = CommandLine.arguments.contains("--mockMode")
}
```

## Storage Keys

Centralized storage key management:

```swift
public enum StorageKeys {
    public static let onboardingFlowComplete = "onboardingFlow.complete"
    public static let llmSource = "llmsource"
    public static let openAIModel = "openAI.model"
    public static let enableTextToSpeech = "settings.enableTextToSpeech"
}
```
