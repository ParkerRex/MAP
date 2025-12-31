import { CalendarSyncService } from "@/services/CalendarSyncService";
import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";

type Provider = "GOOGLE" | "WHOOP";

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string[];
}

const configs: Record<Provider, OAuthConfig> = {
  GOOGLE: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: ["https://www.googleapis.com/auth/calendar"],
  },
  WHOOP: {
    clientId: process.env.WHOOP_CLIENT_ID || "",
    clientSecret: process.env.WHOOP_CLIENT_SECRET || "",
    redirectUri: process.env.WHOOP_CALLBACK_URL || "",
    authorizationEndpoint: `${process.env.WHOOP_API_HOSTNAME || ""}/oauth/oauth2/auth`,
    tokenEndpoint: `${process.env.WHOOP_API_HOSTNAME || ""}/oauth/oauth2/token`,
    scope: [
      "offline",
      "read:body_measurement",
      "read:cycles",
      "read:profile",
      "read:recovery",
      "read:sleep",
      "read:workout",
    ],
  },
};

export class AuthManager {
  async storeToken(
    provider: Provider,
    userId: string,
    tokenData: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    },
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    try {
      await calendarDb.upsertIntegration({
        userId,
        provider,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt.toISOString(),
      });

      console.log("Token stored successfully:", {
        provider,
        userId,
        expiresAt,
      });
    } catch (error) {
      console.error("Error storing token:", error);
      throw new Error(
        `Failed to store integration token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getAccessToken(
    provider: Provider,
    userId: string,
  ): Promise<string | null> {
    try {
      const data = await calendarDb.getIntegration(userId, provider);

      if (!data) {
        console.error("No token found for user and provider");
        return null;
      }

      if (this.isTokenExpired(data)) {
        // Token has expired, refresh it
        if (data.refreshToken) {
          return this.refreshToken(provider, data.refreshToken, userId);
        }
        return null;
      }

      return data.accessToken;
    } catch (error) {
      console.error("Error in getAccessToken:", error);
      return null;
    }
  }

  async refreshToken(
    provider: Provider,
    refreshToken: string,
    userId: string,
  ): Promise<string | null> {
    const config = configs[provider];

    try {
      const response = await fetch(config.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TokenResponseData = await response.json();
      if (!data.access_token) {
        throw new Error("No access token returned");
      }

      // Store the new tokens
      await this.storeToken(provider, userId, {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
        expires_in: data.expires_in,
      });

      return data.access_token;
    } catch (error) {
      console.error(`Error refreshing ${provider} token:`, error);
      return null;
    }
  }

  private isTokenExpired(token: TokenData): boolean {
    if (!token.expiresAt) return false;
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    return expiresAt <= now || expiresAt.getTime() - now.getTime() < 300000; // 5 minutes buffer
  }

  async hasIntegration(provider: Provider, userId: string): Promise<boolean> {
    return calendarDb.hasIntegration(userId, provider);
  }

  async retrieveToken(
    provider: Provider,
    userId: string,
  ): Promise<TokenData | null> {
    const data = await calendarDb.getIntegration(userId, provider);
    if (!data) return null;

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || "",
      expiresAt: data.expiresAt || "",
    };
  }

  async exchangeCodeForToken(
    provider: Provider,
    code: string,
    _state: string | null,
  ): Promise<void> {
    try {
      const config = configs[provider];
      const response = await fetch(config.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TokenResponseData = await response.json();
      if (!data.access_token) {
        throw new Error("No access token returned");
      }

      const user = await getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      await this.storeToken(provider, user.id, {
        access_token: data.access_token,
        refresh_token: data.refresh_token || "",
        expires_in: data.expires_in,
      });

      if (provider === "GOOGLE") {
        const calendarSyncService = new CalendarSyncService();
        await calendarSyncService.syncCalendar(user.id);
      }
    } catch (error) {
      console.error("Error in exchangeCodeForToken:", error);
      throw new Error(
        `Failed to exchange code for token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

type TokenData = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

type TokenResponseData = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};
