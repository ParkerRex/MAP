# Testing

Testing strategies for the Map Health iOS app.

## Test Structure

```
ios/
├── Tests/
│   └── MapHealthCoreTests/         # Unit tests (SPM)
│       └── PromptGeneratorTests.swift
│
├── MapHealthTests/                  # Legacy unit tests (xcodeproj)
│   └── PromptGeneratorTests.swift
│
└── MapHealthUITests/               # UI tests (xcodeproj)
    ├── OnboardingUITests.swift
    └── HealthChatViewUITests.swift
```

## Unit Tests

### Running with xcodebuild

```bash
xcodebuild test \
  -scheme MapHealthCore \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15,OS=17.0" \
  CODE_SIGNING_ALLOWED=NO
```

### Running with xcbeautify

```bash
xcodebuild test \
  -scheme MapHealthCore \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  CODE_SIGNING_ALLOWED=NO \
  | xcbeautify
```

### Parallel Testing

```bash
xcodebuild test \
  -scheme MapHealthCore \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  -parallel-testing-enabled YES \
  CODE_SIGNING_ALLOWED=NO
```

## Swift Testing Framework

The app uses Swift Testing (not XCTest):

```swift
import Foundation
@testable import MapHealthCore
import Testing

struct PromptGeneratorTests {
    var sampleHealthData: [HealthData] = createSampleHealthData()

    @Test
    func buildMainPrompt() {
        let promptGenerator = PromptGenerator(with: sampleHealthData)
        let mainPrompt = promptGenerator.buildMainPrompt()

        #expect(mainPrompt != nil)
        #expect(mainPrompt.contains("You are MapHealth"))

        for healthDataItem in sampleHealthData {
            #expect(mainPrompt.contains(healthDataItem.date))
        }
    }
}
```

### Key Differences from XCTest

| XCTest | Swift Testing |
|--------|---------------|
| `XCTestCase` class | Plain `struct` |
| `func test...()` | `@Test func ...()` |
| `XCTAssertEqual` | `#expect(a == b)` |
| `XCTAssertTrue` | `#expect(condition)` |
| `XCTAssertNil` | `#expect(value == nil)` |
| `setUp()` | Initializer |
| `tearDown()` | `deinit` |

## Mock Data

Create test data for HealthKit-dependent code:

```swift
private static func createSampleHealthData() -> [HealthData] {
    var healthData: [HealthData] = []
    for day in 0...13 {
        guard let date = Calendar.current.date(byAdding: .day, value: -(13 - day), to: Date()) else {
            continue
        }
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: date)

        let healthDataItem = HealthData(
            date: dateString,
            steps: Double.random(in: 5000..<10000),
            activeEnergy: Double.random(in: 100..<500),
            exerciseMinutes: Double.random(in: 10..<100),
            bodyWeight: Double.random(in: 100..<120),
            sleepHours: Double.random(in: 4..<9)
        )

        healthData.append(healthDataItem)
    }
    return healthData
}
```

## UI Tests

### Running UI Tests

```bash
xcodebuild test \
  -scheme MapHealth \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  -only-testing:MapHealthUITests
```

### Feature Flags for Testing

```swift
public enum FeatureFlags {
    public static let skipOnboarding = CommandLine.arguments.contains("--skipOnboarding")
    public static let showOnboarding = CommandLine.arguments.contains("--showOnboarding")
    public static let resetKeychainStorage = CommandLine.arguments.contains("--resetKeychainStorage")
    public static let mockMode = CommandLine.arguments.contains("--mockMode")
}
```

### Using Feature Flags in Tests

```swift
// In test setup
app.launchArguments = ["--skipOnboarding", "--mockMode"]
app.launch()
```

### Example UI Test

```swift
import XCTest

final class OnboardingUITests: XCTestCase {
    func testOnboardingFlow() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--showOnboarding"]
        app.launch()

        // Welcome screen
        XCTAssertTrue(app.staticTexts["WELCOME_TITLE"].exists)
        app.buttons["WELCOME_BUTTON"].tap()

        // Disclaimer screen
        XCTAssertTrue(app.staticTexts["INTERESTING_MODULES_TITLE"].exists)
        app.buttons["INTERESTING_MODULES_BUTTON"].tap()

        // LLM Source selection
        XCTAssertTrue(app.pickers["llmSourcePicker"].exists)
    }
}
```

## Test Configuration

### Test Plan

The `MapHealth.xctestplan` configures test execution:

```json
{
  "configurations" : [
    {
      "name" : "Test Scheme Action",
      "options" : { }
    }
  ],
  "testTargets" : [
    {
      "target" : {
        "containerPath" : "container:MapHealth.xcodeproj",
        "identifier" : "MapHealthTests"
      }
    },
    {
      "target" : {
        "containerPath" : "container:MapHealth.xcodeproj",
        "identifier" : "MapHealthUITests"
      }
    }
  ]
}
```

## Code Coverage

### Enable Coverage

```bash
xcodebuild test \
  -scheme MapHealth \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  -enableCodeCoverage YES
```

### View Coverage Report

Coverage data is in the derived data directory:
```
~/Library/Developer/Xcode/DerivedData/MapHealth-*/Build/ProfileData/*/Coverage.profdata
```

## CI/CD Testing

### GitHub Actions Workflow

```yaml
- name: Run Unit Tests
  run: |
    xcodebuild test \
      -scheme MapHealthCore \
      -sdk iphonesimulator \
      -destination "platform=iOS Simulator,name=iPhone 15,OS=17.2" \
      -parallel-testing-enabled YES \
      CODE_SIGNING_ALLOWED=NO \
      | xcbeautify --renderer github-actions
```

### Caching

```yaml
- name: Cache SPM
  uses: actions/cache@v4
  with:
    path: |
      ios/.build
      ~/Library/Developer/Xcode/DerivedData
    key: ${{ runner.os }}-spm-${{ hashFiles('ios/Package.swift') }}
```

## Testing HealthKit

### Simulator Limitations

- No real health data in simulator
- HealthKit authorization always succeeds
- Background delivery doesn't work

### Physical Device Testing

For real HealthKit testing:
1. Deploy to physical device
2. Grant HealthKit permissions
3. Use Health app to add test data

### Mock HealthKit

For unit tests, use protocols and mocks:

```swift
protocol HealthDataFetching {
    func fetchSteps() async throws -> [Double]
}

class MockHealthDataFetcher: HealthDataFetching {
    var mockSteps: [Double] = [1000, 2000, 3000]

    func fetchSteps() async throws -> [Double] {
        return mockSteps
    }
}
```

## Debugging Tests

### Verbose Output

```bash
xcodebuild test ... -verbose
```

### Test Specific Test

```bash
xcodebuild test \
  -scheme MapHealthCore \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  -only-testing:MapHealthCoreTests/PromptGeneratorTests/buildMainPrompt
```

### Result Bundle

```bash
xcodebuild test \
  ... \
  -resultBundlePath TestResults.xcresult
```

View with:
```bash
xcrun xcresulttool get --path TestResults.xcresult --format json
```
