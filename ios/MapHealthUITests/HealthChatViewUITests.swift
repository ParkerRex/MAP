


import XCTest
import XCTest
import XCTestExtensions


final class HealthChatViewUITests: XCTestCase {
    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false

        let app = XCUIApplication()
        app.launchArguments = ["--showOnboarding", "--resetKeychainStorage", "--mockMode"]
        app.deleteAndLaunch(withSpringboardAppName: "MapHealth")
    }

    override func tearDownWithError() throws {
        try super.tearDownWithError()
    }
    
    func testChatView() throws {
        let app = XCUIApplication()
        try app.conductOnboardingIfNeeded()
        
        XCTAssert(app.textFields["chatInput"].waitForExistence(timeout: 2))
        try app.textFields["chatInput"].enter(value: "New Message!")
        
        XCTAssert(app.buttons["chatSendButton"].waitForExistence(timeout: 2))
        app.buttons["chatSendButton"].tap()
        
        sleep(3)
        
        XCTAssert(app.staticTexts["This is a mock response for testing."].waitForExistence(timeout: 5))
    }
    
    func testSettingsView() throws {
        let app = XCUIApplication()
        try app.conductOnboardingIfNeeded()

        let settingsButton = app.buttons["settingsButton"]
        XCTAssert(settingsButton.waitForExistence(timeout: 5))
        settingsButton.tap()
        
        XCTAssert(app.buttons["changeModelButton"].firstMatch.waitForExistence(timeout: 1))
        app.buttons["changeModelButton"].firstMatch.tap()
        XCTAssert(app.secureTextFields["OpenAI API Key"].firstMatch.waitForExistence(timeout: 1))
        try app.secureTextFields["OpenAI API Key"].enter(value: "sk-123456789")
        app.buttons["Next"].firstMatch.tap()
        XCTAssert(app.pickerWheels.firstMatch.waitForExistence(timeout: 1))
        app.pickerWheels.firstMatch.adjust(toPickerWheelValue: "gpt-4o")
        app.buttons["Save OpenAI Model"].firstMatch.tap()
        
        XCTAssert(app.staticTexts["Map Health"].waitForExistence(timeout: 2))
        settingsButton.tap()
        app.buttons["resetButton"].firstMatch.tap()
        
        XCTAssert(app.staticTexts["Map Health"].waitForExistence(timeout: 2))
    }
    
    func testResetChat() throws {
        let app = XCUIApplication()
        try app.conductOnboardingIfNeeded()
        
        let resetChatButton = app.buttons["resetChatButton"]
        XCTAssertTrue(resetChatButton.waitForExistence(timeout: 5))
        resetChatButton.tap()
    }
}
