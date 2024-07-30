import { CalendarSyncService } from "@/services/CalendarSyncService";
import { Database } from "@/utils/supabase/database.types";
import { createClient } from "@map/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CalendarClient } from "./calendar";

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
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

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
      const { error } = await this.supabase.from("integration").upsert(
        {
          user_id: userId,
          provider: provider,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: "user_id,provider",
        },
      );

      if (error) {
        console.error("Supabase error storing token:", error);
        throw new Error(`Failed to store integration token: ${error.message}`);
      }

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
      const { data, error } = await this.supabase
        .from("integration")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", userId)
        .eq("provider", provider)
        .single();

      if (error) {
        console.error("Error fetching token:", error);
        return null;
      }

      if (!data) {
        console.error("No token found for user and provider");
        return null;
      }

      if (this.isTokenExpired(data)) {
        // Token has expired, refresh it
        return this.refreshToken(provider, data.refresh_token, userId);
      }

      return data.access_token;
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
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    return expiresAt <= now || expiresAt.getTime() - now.getTime() < 300000; // 5 minutes buffer
  }

  async hasIntegration(provider: Provider, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("integration")
      .select("id")
      .eq("provider", provider)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error checking integration:", error);
      return false;
    }

    return !!data;
  }

  async retrieveToken(
    provider: Provider,
    userId: string,
  ): Promise<TokenData | null> {
    const { data, error } = await this.supabase
      .from("integration")
      .select("access_token, refresh_token, expires_at")
      .eq("provider", provider)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error retrieving token:", error);
      return null;
    }
    return data;
  }

  async exchangeCodeForToken(
    provider: Provider,
    code: string,
    state: string | null,
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

      const { data: userData, error: userError } =
        await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("No authenticated user found");
      }

      await this.storeToken(provider, userData.user.id, {
        access_token: data.access_token,
        refresh_token: data.refresh_token || "",
        expires_in: data.expires_in,
      });

      if (provider === "GOOGLE") {
        const calendarSyncService = new CalendarSyncService();
        await calendarSyncService.syncCalendar(userData.user.id);
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
  access_token: string;
  refresh_token: string;
  expires_at: string;
};

type TokenResponseData = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};
