/// Constants shared across the Map Health to access
/// storage information including the `AppStorage` and `SceneStorage`
public enum StorageKeys {
    public enum Defaults {
        public static let openAIModel = "gpt-4o"
        public static let claudeModel = "claude-sonnet-4-20250514"
        public static let llmSource = "openai"
        public static let appearanceMode = "system"
    }

    // MARK: - Onboarding
    /// A `Bool` flag indicating of the onboarding was completed.
    public static let onboardingFlowComplete = "onboardingFlow.complete"
    /// An OpenAI model string indicating the model to use
    public static let openAIModel = "openAI.model"
    /// A Claude model string indicating the model to use
    public static let claudeModel = "claude.model"
    /// Selected LLM source (openai, claude, fog, local)
    public static let llmSource = "llm.source"
    /// Appearance mode (system, light, dark)
    public static let appearanceMode = "appearance.mode"
}
