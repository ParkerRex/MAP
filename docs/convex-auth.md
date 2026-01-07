# Better Auth (Track B)

This project uses the Convex Better Auth component with Google-only OAuth at launch.

## Server Setup

- `convex/auth.ts` configures Better Auth with Google provider and Convex plugin.
- `convex/http.ts` registers Better Auth routes (`/api/auth/*`).
- `convex/auth.config.ts` wires Convex auth config provider.
- `convex/convex.config.ts` installs the Better Auth component.

## Environment Variables

- `SITE_URL` (public web URL; used for OAuth redirects)
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `VITE_CONVEX_URL` (web app; Convex deployment URL)
- `VITE_CONVEX_SITE_URL` (web app; Convex site URL, ends in `.convex.site`)

OAuth redirect URI to configure in Google Cloud:

- `${SITE_URL}/api/auth/callback/google`

## Web Auth (TanStack Start)

Scaffolded client/server helpers (TanStack Start expected structure):

- `src/lib/auth-client.ts`
  - Uses `createAuthClient()` from `better-auth/react` + Convex client plugin.
- `src/lib/auth-server.ts`
  - Uses `convexBetterAuthReactStart()` with `VITE_CONVEX_URL` + `VITE_CONVEX_SITE_URL`.
- `src/routes/api/auth/$.ts`
  - Mounts `handler` to expose `/api/auth/*` for the web app.

Required Vite env vars for the web app:

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`

## iOS Auth (Web OAuth)

Preferred flow:

1. Present an `ASWebAuthenticationSession` to `${SITE_URL}/login` (or a dedicated `/auth/ios` page).
2. After successful login, redirect back to a custom scheme (`maphealth://auth/callback`) with a token or session payload.
3. Store the token in Keychain and pass it to the Convex Swift client.

The exact callback payload will be defined when the TanStack Start app login page is implemented.

## Account Settings UI

Minimal requirements:

- Show connected state (Google connected).
- Provide sign-out action.
- Optionally allow disconnect (if you want to revoke linked account).
