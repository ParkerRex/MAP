import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  getClaudeAuthUrl,
} from "@/lib/claude";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=unauthorized`,
      );
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Generate state for CSRF protection
    const state = randomBytes(32).toString("hex");

    // Build redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/claude/callback`;

    // Get authorization URL
    const authUrl = getClaudeAuthUrl(state, codeChallenge, redirectUri);

    // Create redirect response with cookies
    const response = NextResponse.redirect(authUrl);

    // Store state and code verifier in cookies
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
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("Claude auth initiation error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_failed`,
    );
  }
}
