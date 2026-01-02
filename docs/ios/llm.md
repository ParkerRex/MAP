# LLM Integration

MapHealth uses a lightweight OpenAI client to generate responses based on recent HealthKit data.

## Overview

- OpenAI-only (no local/fog providers).
- API key stored in Keychain via `KeychainService`.
- Chat UI is custom SwiftUI with Liquid Glass styling.

## Key Components

- `OpenAIClient` (`ios/Sources/MapHealthCore/Services/OpenAIClient.swift`)
  - Sends `chat/completions` requests to OpenAI.
- `HealthDataInterpreter` (`ios/Sources/MapHealthCore/HealthKit/HealthDataInterpreter.swift`)
  - Generates system prompt from HealthKit data.
  - Manages chat messages and calls `OpenAIClient`.

## API Key Storage

Use `KeychainService` to persist the OpenAI key:

```swift
try KeychainService.shared.saveOpenAIKey("sk-...")
```

## Model Selection

The selected model is stored in `AppStorage` under `StorageKeys.openAIModel`.

