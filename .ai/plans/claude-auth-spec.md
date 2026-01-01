# Claude Authentication Integration Spec

Add Claude (Anthropic) as an additional LLM provider using OAuth for Claude Max/Claude Code subscriptions. Simplified for personal use with web-first implementation.

## Overview

### Goals
1. Allow users with Claude Max or Claude Code subscriptions to use Claude for health data analysis
2. Provide Claude as an additional option alongside OpenAI (not a replacement)
3. Centralize authentication on the web backend - iOS calls through web API
4. Use OAuth only (no manual API key entry)

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Concurrent OAuth | Last-write-wins | Users rarely open multiple auth tabs; accept cookie overwrite |
| Token refresh race | Optimistic locking | Follow opencode pattern - first request locks, others wait |
| Subscription expiry | Graceful degradation | Show error, offer to switch providers, keep connected but disabled |
| Proxy vs direct | Accept proxy latency | Simpler architecture outweighs latency cost |
| iOS OAuth callback | Custom URL scheme | `maphealth://` - simpler than universal links |
| Stream failure | Retry full request | Show error with "Retry" button, user decides |
| Model selection | Full model selection | All Claude models available, hardcode and update with deploys |
| Provider priority | Explicit user selection | Radio buttons in unified AI Providers settings section |
| Rate limits | User-friendly error | "Claude is temporarily unavailable" - no technical details |
| Settings UI | Unified AI Providers | Single section with radio buttons, connected providers selectable |
| Token security | Database encryption at rest | Rely on managed DB encryption |
| Onboarding | Optional step | Skippable, no active promotion later |
| Development testing | Shared test account | Use team Claude Max account for dev/staging |
| API stability | Pin and monitor | Pin to beta version, monitor Anthropic changelog |
| Disconnect flow | Local delete only | No Anthropic revocation call, tokens expire in 8 hours |
| Logging | Minimal | Errors and auth failures only, never message content |
| System prompts | Server-enforced | Follow opencode pattern, client cannot override |
| Cross-platform sync | Real-time | SSE or polling with refetchInterval |
| API features | Text-only | No tools, vision, or JSON mode needed |
| Model versioning | Hardcode latest | Update model strings in code, redeploy |
| Error messages | User-friendly generic | "Something went wrong" not "Anthropic API error" |
| Build order | Web first, then iOS | Validate OAuth on web before iOS |
| Context management | Proxy manages | Server truncates old messages to fit context window |
| Max tokens | Follow opencode | Check opencode implementation |
| Streaming infra | Next.js API routes | Start simple, migrate to Elysia if needed |
| Lock storage | Follow opencode | Check opencode for locking implementation |
| iOS auth | Deferred | No iOS auth exists yet, tie up later |
| Scope | Simplified | Core OAuth + chat flow only, skip enterprise features |
| Spec style | Reference opencode | Point to opencode files for implementation details |

### Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   iOS App   │────▶│  Web API Proxy  │────▶│  Anthropic API   │
│             │     │  /api/claude/*  │     │  api.anthropic.com│
└─────────────┘     └─────────────────┘     └──────────────────┘
                           │
                   ┌───────▼───────┐
                   │   Database    │
                   │  (integrations│
                   │    table)     │
                   └───────────────┘
```

---

## Reference Implementation

**Follow opencode patterns for everything Claude-related:**

| Component | Reference Path |
|-----------|----------------|
| OAuth flow | `../opencode/packages/opencode/src/auth/` |
| Token management | `../opencode/packages/opencode/src/auth/` |
| Max tokens | Check opencode implementation |
| System prompts | Check opencode implementation |
| Locking mechanism | Check opencode implementation |

---

## Claude Max OAuth Protocol

### Configuration
| Property | Value |
|----------|-------|
| Client ID | `9d1c250a-e61b-44d9-88ed-5944d1962f5e` |
| Authorization URL | `https://claude.ai/oauth/authorize` |
| Token URL | `https://console.anthropic.com/v1/oauth/token` |
| Scopes | `user:inference user:profile` |
| Token Lifetime | 8 hours (28800 seconds) |
| Security | PKCE required (public client, no secret) |

### Token Format
- Access token prefix: `sk-ant-oat01-`
- Refresh token prefix: `sk-ant-ort01-`

### API Headers Required
```
Authorization: Bearer {access_token}
anthropic-version: 2023-06-01
anthropic-beta: oauth-2025-04-20
```

### PKCE Flow
1. Generate 32-byte random `code_verifier`
2. Create `code_challenge` = base64url(SHA256(code_verifier))
3. Include `code_challenge` and `code_challenge_method=S256` in auth request
4. Include `code_verifier` in token exchange

---

## Web App Implementation

### Database Changes

**File**: `src/db/schema.ts`

```typescript
// Add CLAUDE to enum
export const integrationProviderEnum = pgEnum("integration_provider", [
  "GOOGLE",
  "WHOOP",
  "CLAUDE"
]);
```

**Migration**: Run `bun run db:generate && bun run db:push`

---

### OAuth Library

**New File**: `src/lib/claude.ts`

Follow opencode patterns for:
- `generateCodeVerifier()` - PKCE code verifier generation
- `generateCodeChallenge()` - SHA256 hash for PKCE
- `getClaudeAuthUrl()` - Build OAuth authorization URL
- `exchangeClaudeCode()` - Exchange auth code for tokens
- `refreshClaudeToken()` - Refresh expired access token
- `ClaudeClient` class - API client with required headers
- `getClaudeClientForUser()` - Get client with auto-refresh and optimistic locking

**Token Refresh with Optimistic Locking:**
- Check opencode for exact locking implementation
- First request to detect expiry sets lock, others wait/retry
- Prevents race condition where multiple requests trigger refresh

---

### API Routes

#### Auth Initiation
**File**: `src/app/api/claude/auth/route.ts`

- Requires authenticated user
- Generates state + PKCE verifier/challenge
- Stores in HTTP-only cookies (10 min TTL)
- Redirects to Claude OAuth

#### OAuth Callback
**File**: `src/app/api/claude/callback/route.ts`

- Validates state from cookie
- Exchanges code using PKCE verifier
- Stores tokens in integrations table
- Clears OAuth cookies
- Redirects to settings with success/error

#### Connection Status
**File**: `src/app/api/claude/status/route.ts`

- Returns `{ connected: boolean, expiresAt?: string }`
- Used for real-time sync via refetchInterval

#### Disconnect
**File**: `src/app/api/claude/disconnect/route.ts`

- Deletes integration from database
- No Anthropic revocation call (tokens expire naturally in 8 hours)

#### Chat Proxy
**File**: `src/app/api/claude/chat/route.ts`

- Requires authenticated user with Claude connected
- Accepts: `{ messages, model?, stream? }`
- **Server-enforced system prompt** - client `system` param is ignored, use opencode pattern
- **Proxy manages context window** - truncate old messages before API call
- **Max tokens**: Follow opencode settings
- Streaming via SSE for real-time responses

**Error Handling (user-friendly generic):**
- Rate limit: "Claude is temporarily unavailable. Please try again in a few minutes."
- Auth failed: "Your Claude connection needs to be refreshed."
- Content policy: "Claude couldn't process that request. Please try rephrasing."
- General: "Something went wrong. Please try again."

**Graceful Degradation on Subscription Expiry:**
- Detect 401/403 from Anthropic
- Return error suggesting user check subscription or switch to OpenAI
- Keep Claude "connected" in database but show as unavailable in UI

---

### Client Integration

#### API Client
**File**: `src/lib/api/client.ts`

```typescript
claude = {
  status: () => this.request<{ connected: boolean; expiresAt?: string }>("/claude/status"),
  disconnect: () => this.request<{ success: boolean }>("/claude/disconnect", { method: "POST" }),
  chat: (params: ClaudeChatParams) =>
    this.request<ClaudeChatResponse>("/claude/chat", {
      method: "POST",
      body: JSON.stringify(params),
    }),
}
```

#### Query Keys
**File**: `src/lib/api/query-keys.ts`

```typescript
claude: {
  status: ["claude", "status"] as const,
  all: ["claude"] as const,
}
```

#### Hooks
**New File**: `src/hooks/use-claude.ts`

```typescript
export function useClaudeStatus() {
  return useQuery({
    queryKey: queryKeys.claude.status,
    queryFn: () => api.claude.status(),
    refetchInterval: 30000, // Real-time sync every 30s
  });
}

export function useClaudeDisconnect() {
  return useSimpleMutation({
    mutationFn: () => api.claude.disconnect(),
    invalidateKeys: [queryKeys.claude.all],
    successMessage: "Claude disconnected",
  });
}

export function useClaudeConnect() {
  return {
    connect: () => {
      window.location.href = "/api/claude/auth";
    },
  };
}
```

---

### Settings UI

**Unified AI Providers Section with Radio Buttons:**

```
AI Providers
─────────────────────────────────────
◉ OpenAI                    [Connected ✓]
   GPT-4o, GPT-4 Turbo

○ Claude                    [Connect →]
   Claude 4 Sonnet, Haiku

○ Local                     [Configure]
   Llama 3.2
─────────────────────────────────────
```

- Radio buttons for active provider selection
- Connected providers are selectable, disconnected are grayed out
- Active provider highlighted
- No active promotion for Claude - users discover in settings

**Model Selection (when Claude connected):**
- Show all available Claude models
- Hardcode model list, update with deploys:
  - `claude-sonnet-4-20250514` (default)
  - `claude-3-5-haiku-20241022`
  - Add future models via code updates

---

## iOS App Implementation (Deferred)

iOS auth doesn't exist yet. For personal use, focusing on web first. iOS implementation to be tied up later.

### Future iOS Requirements

When iOS auth is implemented:

1. **Shared Session Cookies** - iOS uses WKWebView or shared cookie container for web session
2. **LLMSource Enum** - Add `.claude` case
3. **Full Spezi Integration** - LLMClaudeSchema/Session/Platform matching OpenAI pattern
4. **ClaudeAPIClient** - Calls web backend proxy using shared session
5. **Custom URL Scheme** - `maphealth://claude-callback` for OAuth
6. **Re-auth Prompt** - Show login sheet if session expires mid-conversation

### Reference Files for iOS
| Purpose | File |
|---------|------|
| LLM pattern | `ios/MapHealth/Onboarding/OpenAI/` |
| Chat view | `ios/MapHealth/Views/HealthChatView.swift` |
| LLM source | `ios/Sources/MapHealthCore/Models/LLMSource.swift` |

---

## Environment Variables

Add to `.env`:
```bash
# Claude OAuth (official Claude Code client)
CLAUDE_CLIENT_ID=9d1c250a-e61b-44d9-88ed-5944d1962f5e
# No client secret needed for PKCE public client
```

---

## Simplified Implementation Checklist

### Phase 1: Database & Core Backend
- [ ] Add "CLAUDE" to `integrationProviderEnum` in `src/db/schema.ts`
- [ ] Run database migration
- [ ] Create `src/lib/claude.ts` (follow opencode patterns)

### Phase 2: OAuth Routes
- [ ] Create `src/app/api/claude/auth/route.ts`
- [ ] Create `src/app/api/claude/callback/route.ts`
- [ ] Create `src/app/api/claude/status/route.ts`
- [ ] Create `src/app/api/claude/disconnect/route.ts`

### Phase 3: Chat Proxy
- [ ] Create `src/app/api/claude/chat/route.ts`
- [ ] Implement streaming SSE
- [ ] Add context window management (follow opencode)
- [ ] Server-enforced system prompt (follow opencode)

### Phase 4: Web Client
- [ ] Update `src/lib/api/client.ts` with claude methods
- [ ] Update `src/lib/api/query-keys.ts`
- [ ] Create `src/hooks/use-claude.ts`
- [ ] Add unified AI Providers section to settings (radio buttons)
- [ ] Add model selection UI

### Phase 5: Testing
- [ ] Test OAuth flow end-to-end with test account
- [ ] Test chat with streaming
- [ ] Test token refresh after 8 hours
- [ ] Test error handling and graceful degradation

### Future: iOS (when auth exists)
- [ ] Set up iOS auth infrastructure
- [ ] Implement Claude integration following spec

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 8-hour token expiry | Proactive refresh with optimistic locking (follow opencode) |
| OAuth beta status | Pin to current version, monitor Anthropic changelog |
| Streaming in API routes | Use Next.js for now, migrate to Elysia if needed |
| Context overflow | Proxy truncates old messages before API call |

---

## Logging

Minimal logging for privacy:
- Log auth failures (OAuth errors, token refresh failures)
- Log API errors (rate limits, server errors) - no details
- Never log message content
- No analytics or usage tracking
