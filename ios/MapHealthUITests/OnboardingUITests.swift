


import XCTest
import XCTest
import XCTestExtensions
import XCTHealthKit


final class OnboardingUITests: XCTestCase {
    override func setUpWithError() throws {
        try super.setUpWithError()

        continueAfterFailure = false

        let app = XCUIApplication()
        app.launchArguments = ["--showOnboarding", "--resetKeychainStorage"]
        app.deleteAndLaunch(withSpringboardAppName: "MapHealth")
    }

    override func tearDownWithError() throws {
        try super.tearDownWithError()
    }

    func testOnboardingFlow() throws {
        let app = XCUIApplication()

        try app.navigateOnboardingFlow(assertThatHealthKitConsentIsShown: true)
    }
}

extension XCUIApplication {
    func conductOnboardingIfNeeded() throws {
        if self.staticTexts["Map Health"].waitForExistence(timeout: 10) {
            try navigateOnboardingFlow(assertThatHealthKitConsentIsShown: false)
        }
    }

    func navigateOnboardingFlow(assertThatHealthKitConsentIsShown: Bool = true) throws {
        try navigateOnboardingFlowGoogleSignIn()
        try navigateOnboardingFlowApiKey()
        try navigateOnboardingFlowModelSelection()
        try navigateOnboardingFlowHealthKitAccess(assertThatHealthKitConsentIsShown: assertThatHealthKitConsentIsShown)
    }

    private func navigateOnboardingFlowGoogleSignIn() throws {
        XCTAssertTrue(staticTexts["Welcome to MapHealth"].waitForExistence(timeout: 10))
        XCTAssertTrue(buttons["Continue with Google"].waitForExistence(timeout: 10))
        buttons["Continue with Google"].tap()
    }

    private func navigateOnboardingFlowApiKey() throws {
        try secureTextFields["OpenAI API Key"].enter(value: "sk-123456789")
        
        XCTAssertTrue(buttons["Next"].waitForExistence(timeout: 2))
        buttons["Next"].tap()
    }

    private func navigateOnboardingFlowModelSelection() throws {
        XCTAssertTrue(staticTexts["Select an OpenAI Model"].waitForExistence(timeout: 10))
        XCTAssertTrue(buttons["Save OpenAI Model"].waitForExistence(timeout: 10))

        let picker = pickers["modelPicker"]
        let optionToSelect = picker.pickerWheels.element(boundBy: 0)
        optionToSelect.adjust(toPickerWheelValue: "gpt-4o")

        buttons["Save OpenAI Model"].tap()
    }

    private func navigateOnboardingFlowHealthKitAccess(assertThatHealthKitConsentIsShown: Bool = true) throws {
        XCTAssertTrue(staticTexts["HealthKit Access"].waitForExistence(timeout: 10))

        XCTAssertTrue(buttons["Grant Access"].waitForExistence(timeout: 10))
        buttons["Grant Access"].tap()

        handleHealthKitAuthorization(requireSheetToAppear: assertThatHealthKitConsentIsShown)
    }
}
