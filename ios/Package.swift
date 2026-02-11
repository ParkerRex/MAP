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
    dependencies: [],
    targets: [
        // MARK: - MapHealthCore (Pure Swift Library)
        .target(
            name: "MapHealthCore",
            dependencies: [],
            path: "Sources/MapHealthCore",
            exclude: [
                "Services/ConvexChatService.swift",
                "Services/ConvexClient.swift",
                "Services/ConvexHealthSync.swift",
            ]
        ),

        // MARK: - MapHealthCoreTests (Unit Tests)
        .testTarget(
            name: "MapHealthCoreTests",
            dependencies: ["MapHealthCore"],
            path: "Tests/MapHealthCoreTests"
        ),
    ]
)
