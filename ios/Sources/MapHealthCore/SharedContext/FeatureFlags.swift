/// A collection of feature flags for the Map Health.
public enum FeatureFlags {
    /// Skips the onboarding flow to enable easier development of features in the application
    /// and to allow UI tests to skip the onboarding flow.
    public static let skipOnboarding = CommandLine.arguments.contains("--skipOnboarding")
    /// Always show the onboarding when the application is launched. Makes it easy to modify
    /// and test the onboarding flow without the need to manually remove the application or reset the simulator.
    public static let showOnboarding = CommandLine.arguments.contains("--showOnboarding")
    /// Resets stored credentials when the application is launched in order to facilitate testing.
    public static let resetKeychainStorage = CommandLine.arguments.contains("--resetKeychainStorage")
    /// Configures the LLM client to mock all generated responses for development and UI tests
    public static let mockMode = CommandLine.arguments.contains("--mockMode")
}
