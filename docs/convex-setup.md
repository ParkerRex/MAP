# Convex Setup (Track A)

This repo includes the Convex schema + auth integration. You still need to create Convex deployments and set secrets.

## Project + Environments

- Create a Convex project with three deployments: dev, stage, prod.
- Link the local repo to the dev deployment via the Convex CLI.

## Required Secrets (per deployment)

- `SITE_URL` (public base URL for the web app)
- `BETTER_AUTH_SECRET` (generated secret for Better Auth)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `WHOOP_CLIENT_ID`
- `WHOOP_CLIENT_SECRET`
- `OPENAI_API_KEY` (Convex Agents + streaming chat)
- LLM keys (OpenAI/Anthropic)
- Any additional integration API keys used by workflows

## Web App Env (local/.env)

- `VITE_CONVEX_URL` (Convex deployment URL, e.g. `https://<slug>.convex.cloud`)
- `VITE_CONVEX_SITE_URL` (Convex site URL, e.g. `https://<slug>.convex.site`)

## OAuth Redirects

Configure Google OAuth redirect URIs to:

- `${SITE_URL}/api/auth/callback/google`

## Notes

- Use the Convex dashboard or CLI to set secrets.
- Ensure `SITE_URL` matches the deployment URL.
- For local development, use `SITE_URL=http://localhost:3000` (or your TanStack Start dev URL).
