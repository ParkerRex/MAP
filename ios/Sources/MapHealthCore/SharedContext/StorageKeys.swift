/// Constants shared across the Map Health to access
/// storage information including the `AppStorage` and `SceneStorage`
public enum StorageKeys {
    public enum Defaults {
        public static let enableTextToSpeech = false
        public static let llmSource = LLMSource.openai
    }

    // MARK: - Onboarding
    /// A `Bool` flag indicating of the onboarding was completed.
    public static let onboardingFlowComplete = "onboardingFlow.complete"
    /// An `LLMSource` flag indicating the source of the model (local vs. OpenAI)
    public static let llmSource = "llmsource"
    /// An `LLMOpenAIModelType` flag indicating the OpenAI model to use
    public static let openAIModel = "openAI.model"
    /// A `Bool` flag indicating if messages should be spoken.
    public static let enableTextToSpeech = "settings.enableTextToSpeech"
    /// Identifier for selecting a fog model.
    ///
    /// The value should correspond to the registered model name available on the fog node.
    /// MapHealth uses this name to resolve and load the correct model.
    public static let fogModel = "fog.model"
}
