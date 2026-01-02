import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";

// Claude OAuth URLs
const CLAUDE_AUTH_BASE = "https://claude.ai";
const CLAUDE_TOKEN_BASE = "https://console.anthropic.com";
const CLAUDE_API_BASE = "https://api.anthropic.com";

// Claude OAuth Client ID (official Claude Code client)
const CLAUDE_CLIENT_ID = process.env.CLAUDE_CLIENT_ID!;

// Claude OAuth Scopes
export const CLAUDE_SCOPES = ["user:inference", "user:profile"] as const;

// Types
export interface ClaudeTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeContentBlock {
  type: "text";
  text: string;
}

export interface ClaudeMessageResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: ClaudeContentBlock[];
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeStreamEvent {
  type:
    | "message_start"
    | "content_block_start"
    | "content_block_delta"
    | "content_block_stop"
    | "message_delta"
    | "message_stop"
    | "ping"
    | "error";
  message?: ClaudeMessageResponse;
  index?: number;
  content_block?: ClaudeContentBlock;
  delta?: {
    type: "text_delta";
    text: string;
  };
  usage?: {
    output_tokens: number;
  };
  error?: {
    type: string;
    message: string;
  };
}

// PKCE Utilities
function base64url(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

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

// Generate OAuth authorization URL with PKCE
export function getClaudeAuthUrl(
  state: string,
  codeChallenge: string,
  redirectUri: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLAUDE_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: CLAUDE_SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${CLAUDE_AUTH_BASE}/oauth/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeClaudeCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<ClaudeTokenResponse> {
  const response = await fetch(`${CLAUDE_TOKEN_BASE}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLAUDE_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Claude code: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshClaudeToken(refreshToken: string): Promise<ClaudeTokenResponse> {
  const response = await fetch(`${CLAUDE_TOKEN_BASE}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLAUDE_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Claude token: ${error}`);
  }

  return response.json();
}

// Create authenticated Claude client
type ClaudeAuth = { type: "oauth"; token: string } | { type: "api"; token: string };

function isApiKey(token: string) {
  return token.startsWith("sk-ant-") || token.startsWith("sk-");
}

async function createClaudeClient(
  userId: string,
  integration: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  },
): Promise<ClaudeAuth> {
  let { accessToken } = integration;

  if (isApiKey(accessToken) && !integration.refreshToken) {
    return { type: "api", token: accessToken };
  }

  // Check if token needs refresh (within 5 minutes of expiry)
  if (integration.expiresAt && integration.refreshToken) {
    const expiresAt = new Date(integration.expiresAt);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      const tokens = await refreshClaudeToken(integration.refreshToken);

      await calendarDb.updateIntegration(userId, "CLAUDE", {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      });

      accessToken = tokens.access_token;
    }
  }

  return { type: "oauth", token: accessToken };
}

// Make authenticated API request
async function claudeFetch<T>(
  auth: ClaudeAuth,
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${CLAUDE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(auth.type === "oauth"
        ? { Authorization: `Bearer ${auth.token}` }
        : { "x-api-key": auth.token }),
      "anthropic-version": "2023-06-01",
      ...(auth.type === "oauth" ? { "anthropic-beta": "oauth-2025-04-20" } : {}),
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (${response.status}): ${error}`);
  }

  return response.json();
}

// Claude API Client class
export class ClaudeClient {
  private auth: ClaudeAuth;

  constructor(auth: ClaudeAuth) {
    this.auth = auth;
  }

  // Create a message (non-streaming)
  async createMessage(params: {
    model?: string;
    messages: ClaudeMessage[];
    system?: string;
    max_tokens?: number;
  }): Promise<ClaudeMessageResponse> {
    return claudeFetch<ClaudeMessageResponse>(this.auth, "/v1/messages", {
      method: "POST",
      body: JSON.stringify({
        model: params.model ?? "claude-sonnet-4-20250514",
        messages: params.messages,
        system: params.system,
        max_tokens: params.max_tokens ?? 4096,
      }),
    });
  }

  // Create a streaming message
  async *streamMessage(params: {
    model?: string;
    messages: ClaudeMessage[];
    system?: string;
    max_tokens?: number;
  }): AsyncGenerator<ClaudeStreamEvent> {
    const response = await fetch(`${CLAUDE_API_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        ...(this.auth.type === "oauth"
          ? { Authorization: `Bearer ${this.auth.token}` }
          : { "x-api-key": this.auth.token }),
        "anthropic-version": "2023-06-01",
        ...(this.auth.type === "oauth" ? { "anthropic-beta": "oauth-2025-04-20" } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model ?? "claude-sonnet-4-20250514",
        messages: params.messages,
        system: params.system,
        max_tokens: params.max_tokens ?? 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data && data !== "[DONE]") {
            try {
              yield JSON.parse(data) as ClaudeStreamEvent;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }
  }
}

// Get Claude client for current user
export async function getClaudeClient(): Promise<ClaudeClient> {
  const user = await getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const integration = await calendarDb.getIntegration(user.id, "CLAUDE");

  if (!integration) {
    throw new Error("No Claude integration found");
  }

  const auth = await createClaudeClient(user.id, integration);

  return new ClaudeClient(auth);
}

// Get Claude client for a specific user
export async function getClaudeClientForUser(userId: string): Promise<ClaudeClient> {
  const integration = await calendarDb.getIntegration(userId, "CLAUDE");

  if (!integration) {
    throw new Error("No Claude integration found");
  }

  const auth = await createClaudeClient(userId, integration);

  return new ClaudeClient(auth);
}
