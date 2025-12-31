import { type NextRequest, NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";
import { exchangeClaudeCode } from "@/lib/claude";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=unauthorized`,
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("Claude OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_denied`,
      );
    }

    // Validate code
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_code`,
      );
    }

    // Verify state
    const storedState = request.cookies.get("claude_oauth_state")?.value;
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`,
      );
    }

    // Get code verifier for PKCE
    const codeVerifier = request.cookies.get("claude_code_verifier")?.value;
    if (!codeVerifier) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_verifier`,
      );
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/claude/callback`;
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
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=claude_connected`,
    );
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
