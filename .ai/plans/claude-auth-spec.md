# Claude Authentication Integration Spec

Add Claude (Anthropic) as an additional LLM provider using OAuth for Claude Max/Claude Code subscriptions. iOS app calls through web API (centralized service pattern).

## Overview

### Goals
1. Allow users with Claude Max or Claude Code subscriptions to use Claude for health data analysis
2. Provide Claude as an additional option alongside OpenAI (not a replacement)
3. Centralize authentication on the web backend - iOS calls through web API
4. Use OAuth only (no manual API key entry)

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
// Line 15 - Add CLAUDE to enum
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

```typescript
// Claude OAuth v2 Base URLs
const CLAUDE_AUTH_BASE = "https://claude.ai";
const CLAUDE_TOKEN_BASE = "https://console.anthropic.com";
const CLAUDE_API_BASE = "https://api.anthropic.com";

// Scopes
export const CLAUDE_SCOPES = ["user:inference", "user:profile"] as const;

// PKCE utilities
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64url(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64url(new Uint8Array(hash));
}

// Generate OAuth authorization URL
export function getClaudeAuthUrl(
  state: string,
  codeChallenge: string,
  redirectUri: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.CLAUDE_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: CLAUDE_SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${CLAUDE_AUTH_BASE}/oauth/authorize?${params}`;
}

// Exchange code for tokens
export async function exchangeClaudeCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> {
  const response = await fetch(`${CLAUDE_TOKEN_BASE}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.CLAUDE_CLIENT_ID!,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });
  return response.json();
}

// Refresh access token
export async function refreshClaudeToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${CLAUDE_TOKEN_BASE}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.CLAUDE_CLIENT_ID!,
      refresh_token: refreshToken,
    }),
  });
  return response.json();
}

// Claude API client class
export class ClaudeClient {
  constructor(private accessToken: string) {}

  async createMessage(params: MessageParams): Promise<MessageResponse> {
    const response = await fetch(`${CLAUDE_API_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "oauth-2025-04-20",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Streaming version
  async *streamMessage(params: MessageParams): AsyncGenerator<StreamEvent> {
    const response = await fetch(`${CLAUDE_API_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "oauth-2025-04-20",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...params, stream: true }),
    });
    // Parse SSE stream...
  }
}

// Get client for authenticated user (with auto-refresh)
export async function getClaudeClientForUser(userId: string): Promise<ClaudeClient | null> {
  const integration = await getIntegration(userId, "CLAUDE");
  if (!integration) return null;

  // Refresh if expires within 5 minutes
  if (integration.expiresAt && integration.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    const tokens = await refreshClaudeToken(integration.refreshToken!);
    await updateIntegration(userId, "CLAUDE", tokens);
    return new ClaudeClient(tokens.access_token);
  }

  return new ClaudeClient(integration.accessToken);
}
```

---

### API Routes

#### Auth Initiation
**New File**: `src/app/api/claude/auth/route.ts`

```typescript
import { getUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api/errors";
import { generateCodeVerifier, generateCodeChallenge, getClaudeAuthUrl } from "@/lib/claude";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) throw unauthorized();

  const state = randomBytes(32).toString("hex");
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/claude/callback`;
  const authUrl = getClaudeAuthUrl(state, codeChallenge, redirectUri);

  const response = NextResponse.redirect(authUrl);

  // Store state and code_verifier in cookies
  response.cookies.set("claude_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });
  response.cookies.set("claude_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
  });

  return response;
}
```

#### OAuth Callback
**New File**: `src/app/api/claude/callback/route.ts`

```typescript
import { getUser } from "@/lib/auth";
import { exchangeClaudeCode } from "@/lib/claude";
import { saveIntegration } from "@/db/integrations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=claude_auth_failed`
    );
  }

  // Verify state
  const storedState = request.cookies.get("claude_oauth_state")?.value;
  const codeVerifier = request.cookies.get("claude_code_verifier")?.value;

  if (!state || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`
    );
  }

  // Exchange code for tokens
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/claude/callback`;
  const tokens = await exchangeClaudeCode(code!, codeVerifier, redirectUri);

  // Store tokens in database
  await saveIntegration({
    userId: user.id,
    provider: "CLAUDE",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  });

  // Clear cookies and redirect
  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/settings?claude=connected`
  );
  response.cookies.delete("claude_oauth_state");
  response.cookies.delete("claude_code_verifier");

  return response;
}
```

#### Connection Status
**New File**: `src/app/api/claude/status/route.ts`

```typescript
import { getUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api/errors";
import { getIntegration } from "@/db/integrations";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) throw unauthorized();

  const integration = await getIntegration(user.id, "CLAUDE");

  return NextResponse.json({
    connected: !!integration,
    expiresAt: integration?.expiresAt?.toISOString(),
  });
}
```

#### Disconnect
**New File**: `src/app/api/claude/disconnect/route.ts`

```typescript
import { getUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api/errors";
import { deleteIntegration } from "@/db/integrations";
import { NextResponse } from "next/server";

export async function POST() {
  const user = await getUser();
  if (!user) throw unauthorized();

  await deleteIntegration(user.id, "CLAUDE");

  return NextResponse.json({ success: true });
}
```

#### Chat Proxy (for iOS and Web)
**New File**: `src/app/api/claude/chat/route.ts`

```typescript
import { getUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api/errors";
import { getClaudeClientForUser } from "@/lib/claude";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) throw unauthorized();

  const client = await getClaudeClientForUser(user.id);
  if (!client) {
    return NextResponse.json(
      { error: "Claude not connected" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { messages, model = "claude-sonnet-4-20250514", stream = false, system } = body;

  if (stream) {
    // Return SSE stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of client.streamMessage({ model, messages, system })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  const response = await client.createMessage({ model, messages, system });
  return NextResponse.json(response);
}
```

---

### Client Integration

#### API Client
**File**: `src/lib/api/client.ts`

Add to the ApiClient class:
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
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { useSimpleMutation } from "@/lib/api/mutation-factory";

export function useClaudeStatus() {
  return useQuery({
    queryKey: queryKeys.claude.status,
    queryFn: () => api.claude.status(),
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

## iOS App Implementation

### LLMSource Enum Update

**File**: `ios/Sources/MapHealthCore/Models/LLMSource.swift`

```swift
public enum LLMSource: String, CaseIterable, Identifiable, Codable {
    case openai
    case claude
    case fog
    case local

    public var id: String {
        self.rawValue
    }

    public var localizedDescription: LocalizedStringResource {
        switch self {
        case .openai:
            LocalizedStringResource("OPENAI_LLM_LABEL")
        case .claude:
            LocalizedStringResource("CLAUDE_LLM_LABEL")
        case .fog:
            LocalizedStringResource("FOG_LLM_LABEL")
        case .local:
            LocalizedStringResource("LOCAL_LLM_LABEL")
        }
    }
}
```

---

### Claude API Client

**New File**: `ios/Sources/MapHealthCore/Services/ClaudeAPIClient.swift`

```swift
import Foundation

public actor ClaudeAPIClient {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL = URL(string: "https://your-app.com")!) {
        self.baseURL = baseURL
        self.session = URLSession.shared
    }

    public func sendMessage(
        messages: [ChatMessage],
        systemPrompt: String?,
        model: String = "claude-sonnet-4-20250514"
    ) async throws -> ChatResponse {
        let url = baseURL.appendingPathComponent("/api/claude/chat")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Add session cookie for auth

        let body = ClaudeChatRequest(
            messages: messages,
            model: model,
            system: systemPrompt,
            stream: false
        )
        request.httpBody = try JSONEncoder().encode(body)

        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(ChatResponse.self, from: data)
    }

    public func streamMessage(
        messages: [ChatMessage],
        systemPrompt: String?,
        model: String = "claude-sonnet-4-20250514"
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                // Implement SSE streaming...
            }
        }
    }
}
```

---

### Spezi LLM Integration

**New File**: `ios/Sources/MapHealthCore/LLM/LLMClaudeSchema.swift`

```swift
import SpeziLLM

public struct LLMClaudeSchema: LLMSchema {
    public typealias Platform = LLMClaudePlatform

    public struct Parameters {
        public let model: ClaudeModel

        public init(model: ClaudeModel = .claude35Sonnet) {
            self.model = model
        }
    }

    public let parameters: Parameters

    public init(parameters: Parameters = .init()) {
        self.parameters = parameters
    }

    @MainActor
    public func createSession() -> LLMClaudeSession {
        LLMClaudeSession(schema: self)
    }
}

public enum ClaudeModel: String, CaseIterable {
    case claude35Sonnet = "claude-sonnet-4-20250514"
    case claude35Haiku = "claude-3-5-haiku-20241022"
}
```

**New File**: `ios/Sources/MapHealthCore/LLM/LLMClaudeSession.swift`

```swift
import SpeziLLM

@Observable
public class LLMClaudeSession: LLMSession {
    public let schema: LLMClaudeSchema
    public var context: LLMContext = []
    public var state: LLMState = .ready

    private let client = ClaudeAPIClient()

    public init(schema: LLMClaudeSchema) {
        self.schema = schema
    }

    public func generate() async throws -> AsyncThrowingStream<String, Error> {
        state = .generating

        let messages = context.map { message in
            ChatMessage(role: message.role.rawValue, content: message.content)
        }

        return client.streamMessage(
            messages: messages,
            systemPrompt: context.first(where: { $0.role == .system })?.content,
            model: schema.parameters.model.rawValue
        )
    }

    public func cancel() {
        state = .ready
    }
}
```

**New File**: `ios/Sources/MapHealthCore/LLM/LLMClaudePlatform.swift`

```swift
import SpeziLLM

public actor LLMClaudePlatform: LLMPlatform {
    public let configuration: Configuration

    public struct Configuration {
        public let baseURL: URL

        public init(baseURL: URL = URL(string: "https://your-app.com")!) {
            self.baseURL = baseURL
        }
    }

    public init(configuration: Configuration = .init()) {
        self.configuration = configuration
    }
}
```

---

### Claude Auth Onboarding

**New File**: `ios/MapHealth/Onboarding/Claude/ClaudeAuthView.swift`

```swift
import SwiftUI
import AuthenticationServices

struct ClaudeAuthView: View {
    @Environment(\.webAuthenticationSession) private var webAuthSession
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath
    @State private var isAuthenticating = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 60))
                .foregroundStyle(.purple)

            Text("Connect Claude")
                .font(.title)
                .fontWeight(.bold)

            Text("Sign in with your Claude Max or Claude Code subscription to use Claude for health analysis.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            Button(action: startAuth) {
                if isAuthenticating {
                    ProgressView()
                } else {
                    Text("Sign in with Claude")
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(isAuthenticating)

            if let error = errorMessage {
                Text(error)
                    .foregroundStyle(.red)
                    .font(.caption)
            }
        }
        .padding()
    }

    private func startAuth() {
        isAuthenticating = true

        Task {
            do {
                let authURL = URL(string: "\(AppConfig.webBaseURL)/api/claude/auth")!
                let callbackScheme = "maphealth"

                let result = try await webAuthSession.authenticate(
                    using: authURL,
                    callbackURLScheme: callbackScheme
                )

                // Handle successful auth
                onboardingNavigationPath.nextStep()
            } catch {
                errorMessage = error.localizedDescription
            }
            isAuthenticating = false
        }
    }
}
```

---

### Update HealthChatView

**File**: `ios/MapHealth/Views/HealthChatView.swift`

Add Claude case in the `.task(id:)` modifier:

```swift
.task(id: self.modelSettingRefreshId) {
    do {
        if FeatureFlags.mockMode {
            try await healthDataInterpreter.prepareLLM(with: LLMMockSchema())
        } else if FeatureFlags.localLLM || llmSource == .local {
            try await healthDataInterpreter.prepareLLM(with: LLMLocalSchema(model: .llama3_2_3B_4bit))
        } else if llmSource == .fog {
            try await healthDataInterpreter.prepareLLM(
                with: LLMFogSchema(parameters: .init(modelType: self.fogModel))
            )
        } else if llmSource == .claude {
            try await healthDataInterpreter.prepareLLM(
                with: LLMClaudeSchema(parameters: .init(model: .claude35Sonnet))
            )
        } else {
            try await healthDataInterpreter.prepareLLM(
                with: LLMOpenAISchema(parameters: .init(modelType: openAIModel))
            )
        }
    } catch {
        self.showErrorAlert = true
        self.errorMessage = "Error initializing LLM: \(error.localizedDescription)"
    }
}
```

---

### Update LLMSourceSelection

**File**: `ios/MapHealth/Onboarding/LLMSourceSelection.swift`

Update the navigation handling for Claude:

```swift
.onChange(of: llmSource) { _, newValue in
    switch newValue {
    case .openai:
        onboardingNavigationPath.append(customView: OpenAIAPIKey())
    case .claude:
        onboardingNavigationPath.append(customView: ClaudeAuthView())
    case .fog:
        onboardingNavigationPath.append(customView: FogNodeDiscovery())
    case .local:
        onboardingNavigationPath.nextStep()
    }
}
```

---

### Localization

**File**: `ios/MapHealth/Supporting Files/Localizable.xcstrings`

Add:
```json
{
  "CLAUDE_LLM_LABEL": {
    "localizations": {
      "en": { "stringUnit": { "value": "Claude AI" } }
    }
  },
  "CLAUDE_AUTH_TITLE": {
    "localizations": {
      "en": { "stringUnit": { "value": "Connect Claude" } }
    }
  },
  "CLAUDE_AUTH_SUBTITLE": {
    "localizations": {
      "en": { "stringUnit": { "value": "Sign in with your Claude Max or Claude Code subscription" } }
    }
  }
}
```

---

## Environment Variables

Add to `.env`:
```bash
# Claude OAuth (official Claude Code client)
CLAUDE_CLIENT_ID=9d1c250a-e61b-44d9-88ed-5944d1962f5e
# No client secret needed for PKCE public client
```

---

## Implementation Checklist

### Phase 1: Database & Backend
- [x] Add "CLAUDE" to `integrationProviderEnum` in `src/db/schema.ts`
- [ ] Run database migration (`bun run db:push`)
- [x] Create `src/lib/claude.ts` (OAuth helpers, PKCE, client)
- [x] Create `src/app/api/claude/auth/route.ts`
- [x] Create `src/app/api/claude/callback/route.ts`
- [x] Create `src/app/api/claude/status/route.ts`
- [x] Create `src/app/api/claude/disconnect/route.ts`

### Phase 2: Chat Proxy
- [x] Create `src/app/api/claude/chat/route.ts`
- [x] Implement streaming SSE support
- [x] Add token refresh logic

### Phase 3: Web Client
- [x] Update `src/lib/api/client.ts` with claude methods
- [x] Update `src/lib/api/query-keys.ts`
- [x] Create `src/hooks/use-claude.ts`
- [ ] Add Claude connection UI to settings page

### Phase 4: iOS Backend
- [x] Update `LLMSource.swift` enum
- [x] Create `ClaudeAPIClient.swift`
- [ ] Create `LLMClaudeSchema.swift` (requires SpeziLLM protocol implementation)
- [ ] Create `LLMClaudeSession.swift` (requires SpeziLLM protocol implementation)
- [ ] Create `LLMClaudePlatform.swift` (requires SpeziLLM protocol implementation)

### Phase 5: iOS UI
- [x] Create `ClaudeAuthView.swift`
- [x] Update `LLMSourceSelection.swift`
- [ ] Update `HealthChatView.swift` (needs LLMClaudeSchema first)
- [x] Add localization strings

### Phase 6: Testing
- [ ] Test OAuth flow end-to-end (web)
- [ ] Test OAuth flow end-to-end (iOS)
- [ ] Test chat with streaming
- [ ] Test token refresh after 8 hours
- [ ] Test error handling

---

## Implementation Notes

### Completed
The following has been implemented:
1. **Web Backend**: Full OAuth flow with PKCE, chat proxy with streaming
2. **Web Client**: API client, query keys, and hooks
3. **iOS Foundation**: LLMSource enum, ClaudeAPIClient, ClaudeAuthView, localization

### Remaining Work
1. **Database Migration**: Run `bun run db:push` to apply the schema change
2. **SpeziLLM Integration**: Create LLMClaudeSchema, LLMClaudeSession, and LLMClaudePlatform that implement SpeziLLM protocols but route through ClaudeAPIClient
3. **HealthChatView Update**: Add Claude case once LLMClaudeSchema is implemented
4. **Settings UI**: Add Claude connection button to web settings page
5. **Environment Variables**: Add `CLAUDE_CLIENT_ID` to `.env`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 8-hour token expiry | Proactive refresh before expiry (5 min buffer) |
| OAuth beta status | Monitor Anthropic changelog for breaking changes |
| iOS deep linking | Set up universal links or custom URL scheme |
| Rate limits | Add rate limiting on proxy endpoint |
| Streaming complexity | Use established SSE patterns from existing code |

---

## Reference Files

| Purpose | File |
|---------|------|
| OAuth pattern | `src/lib/whoop.ts` |
| Callback pattern | `src/app/api/whoop/callback/route.ts` |
| Integration storage | `src/db/schema.ts` |
| API client | `src/lib/api/client.ts` |
| iOS LLM pattern | `ios/MapHealth/Onboarding/OpenAI/` |
| iOS chat | `ios/MapHealth/Views/HealthChatView.swift` |
| opencode reference | `../opencode/packages/opencode/src/auth/` |
