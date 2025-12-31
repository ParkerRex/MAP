// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MapHealth",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "MapHealthCore", targets: ["MapHealthCore"]),
    ],
    dependencies: [
        // Spezi Core - match xcodeproj versions
        .package(url: "https://github.com/StanfordSpezi/Spezi.git", from: "1.9.0"),
        .package(url: "https://github.com/StanfordSpezi/SpeziHealthKit.git", from: "1.2.0"),

        // Spezi LLM (includes OpenAI, Local, Fog)
        .package(url: "https://github.com/StanfordSpezi/SpeziLLM.git", from: "0.12.0"),

        // Spezi Chat
        .package(url: "https://github.com/StanfordSpezi/SpeziChat.git", from: "0.2.0"),

        // Spezi Storage (includes KeychainStorage)
        .package(url: "https://github.com/StanfordSpezi/SpeziStorage.git", from: "2.0.0"),

        // Spezi Onboarding
        .package(url: "https://github.com/StanfordSpezi/SpeziOnboarding.git", from: "2.0.0"),
    ],
    targets: [
        // MARK: - MapHealthCore (Pure Swift Library)
        .target(
            name: "MapHealthCore",
            dependencies: [
                .product(name: "Spezi", package: "Spezi"),
                .product(name: "SpeziHealthKit", package: "SpeziHealthKit"),
                .product(name: "SpeziLLM", package: "SpeziLLM"),
                .product(name: "SpeziLLMLocal", package: "SpeziLLM"),
                .product(name: "SpeziLLMOpenAI", package: "SpeziLLM"),
                .product(name: "SpeziChat", package: "SpeziChat"),
            ],
            path: "Sources/MapHealthCore"
        ),

        // MARK: - MapHealthCoreTests (Unit Tests)
        .testTarget(
            name: "MapHealthCoreTests",
            dependencies: ["MapHealthCore"],
            path: "Tests/MapHealthCoreTests"
        ),
    ]
)
