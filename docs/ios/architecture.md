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
│   │   │   └── ChatMessage.swift        # Chat message model
│   │   ├── Services/
│   │   │   ├── MapAPIClient.swift       # Backend sync client
│   │   │   └── BackgroundSync.swift     # Background task manager
│   │   ├── HealthKit/
│   │   │   ├── HealthDataFetcher.swift  # HealthKit queries
│   │   │   ├── HealthDataFetcher+Process.swift
│   │   │   ├── HealthDataFetcherError.swift
│   │   │   ├── HealthDataInterpreter.swift  # LLM context builder
│   │   │   ├── HealthKitAuthorizationManager.swift
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
│       ├── MapHealthAppDelegate.swift   # App delegate hooks
│       ├── MapHealthStandard.swift      # Placeholder (unused)
│       ├── MapHealthTestingSetup.swift  # Test configuration
│       ├── Views/
│       │   ├── HealthChatView.swift     # Main chat UI
│       │   └── SettingsView.swift
│       ├── Onboarding/
│       │   ├── OnboardingFlow.swift
│       │   ├── HealthKitPermissions.swift
│       │   └── OpenAI/
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
                        │  OpenAI Client   │────▶│  HealthChatView │
                        └──────────────────┘     └─────────────────┘
```

## Key Classes

### HealthDataFetcher

Queries HealthKit for health metrics.

```swift
public final class HealthDataFetcher {
    public func fetchLastTwoWeeksStepCount() async throws -> [Double]
    public func fetchLastTwoWeeksSleep() async throws -> [Double]
    public func fetchAndProcessHealthData() async -> [HealthData]
}
```

### HealthDataInterpreter

Builds LLM context with health data and manages chat sessions.

```swift
@MainActor
public final class HealthDataInterpreter: ObservableObject {
    @Published public var messages: [ChatMessage]
    public func prepareSession(model: String) async
    public func queryLLM() async throws
    public func resetChat() async
}
```

### MapAPIClient

HTTP client for syncing health data to the backend.

Authentication uses a session token stored in Keychain and sent as a `Bearer` token.
On 401 responses, the app triggers an inline Google re-auth flow.

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

## Design Patterns

### Observable Pattern

Core services use `ObservableObject` for SwiftUI reactivity:

```swift
public final class HealthDataInterpreter: ObservableObject { ... }
```

### Dependency Injection

Dependency injection is done via SwiftUI `environmentObject` and explicit initializers.

### Environment Access

Core services are shared via SwiftUI `environmentObject`:

```swift
@EnvironmentObject private var healthDataInterpreter: HealthDataInterpreter
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
    public static let openAIModel = "openAI.model"
}
```
