# Kimi Model Usage (Rust Gateway)

This project now supports selecting Kimi/Moonshot models directly from the chat UI.

## Runtime Configuration

Set these environment variables for the gateway:

```bash
KIMI_API_KEY=...
KIMI_MODEL=kimi-k2-0711-preview
RUST_GATEWAY_PRIMARY_MODEL=moonshot:kimi-k2-0711-preview
RUST_GATEWAY_FALLBACK_MODELS=openai:gpt-4o-mini
```

## Model Name Handling

- `moonshot:kimi-k2-0711-preview` works directly.
- `kimi:kimi-k2-0711-preview` is normalized to `moonshot`.
- Unprefixed `kimi-*` model names auto-route to Moonshot.

## Chat UI

- `/chat` now fetches available model configuration from `GET /v1/models`.
- The selected model is sent with each run to `POST /v1/chat/runs`.
