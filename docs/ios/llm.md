# LLM Integration

This app can chat through OpenAI (device-side) or Claude (via Map backend).

## OpenAI (device-side)

- Client: `OpenAIClient` (`ios/Sources/MapHealthCore/Services/OpenAIClient.swift`)
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Key storage: Keychain (`KeychainService.saveOpenAIKey`)
- Models exposed in UI: `gpt-4o`, `gpt-4o-mini`
- Model preference stored in `AppStorage` under `StorageKeys.openAIModel`

Chat flow is owned by `HealthDataInterpreter`:

- Builds a system prompt from the last 14 days of HealthKit data.
- Sends messages to OpenAI with that system prompt.
- No streaming, no function calling.

If the OpenAI key is missing, chat fails immediately with `OpenAIClientError.missingAPIKey`.

## Claude (backend integration)

Claude calls go through the Map backend, not directly from the device. The app sends the user session token as `Authorization: Bearer <token>`.

- Client: `ClaudeAPIClient` (`ios/Sources/MapHealthCore/Services/ClaudeAPIClient.swift`)
- Base URL: `https://app.map.ai`
- Endpoints: `/api/claude/status`, `/api/claude/chat`, `/api/claude/disconnect`
- API key is uploaded to the backend via `MapAPIClient.setClaudeApiKey` (`/api/claude/key`)

Claude is wired into chat. Select Claude in LLM settings, then pick a Claude model.

## Other LLM sources

`LLMSource` defines `openai`, `claude`, `fog`, `local`. Only OpenAI and Claude are wired into chat.

## Storage keys

- `StorageKeys.openAIModel` (default `gpt-4o`)
- `StorageKeys.claudeModel` (default `claude-sonnet-4-20250514`)
- `StorageKeys.llmSource` (default `openai`)
