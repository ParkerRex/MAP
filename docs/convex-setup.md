# Convex Setup (Track A)

This repo now includes the Convex schema and access-control helpers. To finish Track A you still need to create Convex deployments and set secrets.

## Project + Environments

- Create a Convex project with three deployments: dev, stage, prod.
- Link the local repo to the dev deployment via the Convex CLI.

## Secrets to Configure (per deployment)

- Google OAuth: client ID + secret
- WHOOP OAuth: client ID + secret
- LLM provider keys (OpenAI/Anthropic)
- Any additional integration API keys used by workflows

## Notes

- Use the Convex dashboard or CLI to set secrets.
- Make sure OAuth redirect URIs match the deployment URL.
