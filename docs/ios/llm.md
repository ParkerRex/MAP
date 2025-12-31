# LLM Integration

How Map Health integrates AI chat capabilities using SpeziLLM.

## Overview

The app supports three LLM execution modes:

| Mode | Description | Requires |
|------|-------------|----------|
| **OpenAI** | Cloud-based GPT models | API key |
| **Local** | On-device Llama models | Model download |
| **Fog** | Local network fog nodes | Network setup |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LLMRunner                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ OpenAI      │  │ Local       │  │ Fog         │              │
│  │ Platform    │  │ Platform    │  │ Platform    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  LLMSession     │
                    │  - context      │
                    │  - generate()   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │HealthDataInterpreter│
                    │  - prepareLLM() │
                    │  - queryLLM()   │
                    │  - resetChat()  │
                    └─────────────────┘
```

## Configuration

LLM platforms are configured in `MapHealthAppDelegate`:

```swift
LLMRunner {
    LLMOpenAIPlatform(
        configuration: .init(
            authToken: .keychain(tag: .openAIKey, username: "com.map.health")
        )
    )
    LLMFogPlatform(
        configuration: .init(
            host: "spezillmfog.local",
            connectionType: .http,
            authToken: .none
        )
    )
    LLMLocalPlatform()
    LLMMockPlatform()
}
```

## HealthDataInterpreter

The main class managing LLM interactions:

```swift
@Observable
public class HealthDataInterpreter: DefaultInitializable, Module, EnvironmentAccessible {
    @Dependency(LLMRunner.self) private var llmRunner
    @Dependency(HealthDataFetcher.self) private var healthDataFetcher

    public var llm: (any LLMSession)?

    /// Initialize LLM with health data context
    @MainActor
    public func prepareLLM(with schema: any LLMSchema) async throws {
        let llm = self.llmRunner(with: schema)
        let systemPrompt = await generateSystemPrompt()
        llm.context.append(systemMessage: systemPrompt)
        self.llm = llm
    }

    /// Generate response to user message
    @MainActor
    public func queryLLM() async throws {
        guard let llm else { return }

        let stream = try await llm.generate()
        for try await token in stream {
            llm.context.append(assistantOutput: token)
        }
    }

    /// Reset conversation
    @MainActor
    public func resetChat() async {
        let systemPrompt = await generateSystemPrompt()
        llm?.context.reset()
        llm?.context.append(systemMessage: systemPrompt)
    }

    private func generateSystemPrompt() async -> String {
        let healthData = await healthDataFetcher.fetchAndProcessHealthData()
        return PromptGenerator(with: healthData).buildMainPrompt()
    }
}
```

## System Prompt

The `PromptGenerator` builds the system prompt with health data:

```swift
public class PromptGenerator {
    public var healthData: [HealthData]

    public func buildMainPrompt() -> String {
        let today = DateFormatter.localizedString(from: Date(), dateStyle: .full, timeStyle: .none)

        var prompt = """
        You are MapHealth, an enthusiastic, expert caretaker with a deep understanding
        in personal health. Given the context, provide a short response that could
        answer the user's question. Do NOT provide statistics. If numbers seem low,
        provide advice on how they can improve.

        Some health metrics over the past two weeks (14 days) to incorporate is given
        below. If a value is zero, the user has not inputted anything for that day.
        Today is \(today). Note that you do not have data about the current day.

        """

        // Add 14 days of health data
        for dayData in healthData {
            prompt += "\(dayData.date): \(buildOneDayPrompt(dayData))\n"
        }

        return prompt
    }
}
```

## OpenAI Mode

### Onboarding Flow

1. **API Key Entry** - `OpenAIAPIKey.swift`
2. **Model Selection** - `OpenAIModelSelection.swift`

### Available Models

```swift
LLMOpenAIModelOnboardingStep(
    actionText: "OPEN_AI_MODEL_SAVE_ACTION",
    models: [
        .gpt3_5_turbo,
        .gpt4_turbo,
        .gpt4o,
        .o1,
        .o1_mini,
        .o3_mini,
        .o3_mini_high
    ]
)
```

### Storage

API key stored securely in Keychain via `SpeziKeychainStorage`.

### Schema

```swift
LLMOpenAISchema(parameters: .init(modelType: openAIModel))
```

## Local Mode

### Model Download

Uses `SpeziLLMLocalDownload` for on-device model management:

```swift
LLMLocalDownloadView(
    model: .llama3_2_3B_4bit,
    downloadDescription: "LLAMA3_DOWNLOAD_DESCRIPTION"
)
```

### Available Models

- Llama 3.2 3B (4-bit quantized)
- Additional models via MLX

### Schema

```swift
LLMLocalSchema(model: .llama3_2_3B_4bit)
```

### Requirements

- ~2GB storage for model
- Apple Silicon recommended
- Increased memory limit entitlement

## Fog Mode

### What is Fog Computing?

Fog nodes are local servers on your network that run LLM inference. Benefits:
- Data never leaves your network
- Lower latency than cloud
- Privacy-preserving

### Onboarding Flow

1. **Information** - `FogInformationView.swift`
2. **Discovery Auth** - `FogDiscoveryAuthView.swift`
3. **Resource Selection** - `FogResourceSelectionView.swift`
4. **Model Selection** - `FogModelSelectionView.swift`

### Available Models

```swift
LLMFogModelOnboardingStep(
    actionText: "FOG_MODEL_SAVE_ACTION",
    models: [
        .llama3_1_8B,
        .llama3_2,
        .phi4,
        .gemma_7B,
        .deepSeekR1
    ]
)
```

### Schema

```swift
LLMFogSchema(parameters: .init(modelType: fogModel))
```

### Network Discovery

Uses Bonjour/mDNS to discover fog nodes on the local network.

## Mock Mode

For testing and development:

```swift
if FeatureFlags.mockMode {
    try await healthDataInterpreter.prepareLLM(with: LLMMockSchema())
}
```

Run with mock mode:
```bash
xcodebuild test ... -- --mockMode
```

## Chat UI

The `HealthChatView` displays the chat interface:

```swift
ChatView(contextBinding, exportFormat: .text)
    .speak(llm.context.chat, muted: !textToSpeech)
    .speechToolbarButton(muted: !$textToSpeech)
    .viewStateAlert(state: llm.state)
```

### Features

- Streaming responses
- Text-to-speech support
- Export conversation
- Reset chat button
- Error handling

## Storage Keys

```swift
public enum StorageKeys {
    public static let llmSource = "llmsource"
    public static let openAIModel = "openAI.model"
    public static let fogModel = "fog.model"
    public static let enableTextToSpeech = "settings.enableTextToSpeech"
}
```

## Switching LLM Source

Users can switch LLM source in Settings:

```swift
Button("Select Execution Type & Model") {
    path.append(customView: LLMSourceSelection())
}
```

After selection, the main view refreshes the LLM:

```swift
.task(id: modelSettingRefreshId) {
    switch llmSource {
    case .openai:
        try await healthDataInterpreter.prepareLLM(
            with: LLMOpenAISchema(parameters: .init(modelType: openAIModel))
        )
    case .fog:
        try await healthDataInterpreter.prepareLLM(
            with: LLMFogSchema(parameters: .init(modelType: fogModel))
        )
    case .local:
        try await healthDataInterpreter.prepareLLM(
            with: LLMLocalSchema(model: .llama3_2_3B_4bit)
        )
    }
}
```

## Error Handling

```swift
do {
    try await healthDataInterpreter.queryLLM()
} catch {
    showErrorAlert = true
    errorMessage = "Error querying LLM: \(error.localizedDescription)"
}
```

## Performance Considerations

| Mode | Latency | Cost | Privacy |
|------|---------|------|---------|
| OpenAI | 1-3s | Per token | Cloud |
| Local | 5-15s | Free | On-device |
| Fog | 2-5s | Free | Network-local |
