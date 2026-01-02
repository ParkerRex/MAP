import { type NextRequest, NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";
import { exchangeClaudeCode } from "@/lib/claude";

interface StateData {
  csrf: string;
  platform: "web" | "ios";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Parse state to get platform info
    let stateData: StateData = { csrf: "", platform: "web" };
    try {
      if (state) {
        stateData = JSON.parse(Buffer.from(state, "base64url").toString());
      }
    } catch {
      // Invalid state, continue with defaults
    }

    const isIOS = stateData.platform === "ios";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    const redirectWithError = (errorCode: string) => {
      if (isIOS) {
        return NextResponse.redirect(`maphealth://auth/callback?error=${errorCode}`);
      }
      return NextResponse.redirect(`${baseUrl}/settings?error=${errorCode}`);
    };

    const redirectWithSuccess = () => {
      if (isIOS) {
        return NextResponse.redirect(`maphealth://auth/callback?success=claude_connected`);
      }
      return NextResponse.redirect(`${baseUrl}/settings?success=claude_connected`);
    };

    const user = await getUser();
    if (!user) {
      return redirectWithError("unauthorized");
    }

    // Check for OAuth errors
    if (error) {
      console.error("Claude OAuth error:", error);
      return redirectWithError("oauth_denied");
    }

    // Validate code
    if (!code) {
      return redirectWithError("missing_code");
    }

    // Verify state
    const storedState = request.cookies.get("claude_oauth_state")?.value;
    if (!state || state !== storedState) {
      return redirectWithError("invalid_state");
    }

    // Get code verifier for PKCE
    const codeVerifier = request.cookies.get("claude_code_verifier")?.value;
    if (!codeVerifier) {
      return redirectWithError("missing_verifier");
    }

    // Exchange code for tokens
    const redirectUri = `${baseUrl}/api/claude/callback`;
    const tokens = await exchangeClaudeCode(code, codeVerifier, redirectUri);

    // Store integration
    await calendarDb.upsertIntegration({
      userId: user.id,
      provider: "CLAUDE",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });

    // Clear cookies and redirect to settings page
    const response = redirectWithSuccess();
    response.cookies.delete("claude_oauth_state");
    response.cookies.delete("claude_code_verifier");

    return response;
  } catch (error) {
    console.error("Claude callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=callback_failed`,
    );
  }
}
