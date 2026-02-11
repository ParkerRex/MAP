import Foundation
import Testing

struct PackageManifestRegressionTests {
    @Test
    func doesNotReferenceLegacyConvexProduct() throws {
        let packageRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent() // MapHealthCoreTests
            .deletingLastPathComponent() // Tests
            .deletingLastPathComponent() // ios

        let manifestPath = packageRoot.appendingPathComponent("Package.swift")
        let manifest = try String(contentsOf: manifestPath, encoding: .utf8)

        #expect(
            !manifest.contains(".product(name: \"Convex\", package: \"convex-swift\")"),
            "Legacy Convex product wiring causes SwiftPM resolution failures."
        )
    }
}
