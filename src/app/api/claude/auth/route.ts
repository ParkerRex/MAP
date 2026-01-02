import { randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { generateCodeChallenge, generateCodeVerifier, getClaudeAuthUrl } from "@/lib/claude";

interface StateData {
  csrf: string;
  platform: "web" | "ios";
}

async function getUserFromSessionToken(token: string) {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      firstName: users.firstName,
      lastName: users.lastName,
      profilePhotoUrl: users.profilePhotoUrl,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return result[0] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform"); // "ios" or undefined (web)
    const sessionToken = searchParams.get("token");

    const user =
      sessionToken && platform === "ios"
        ? await getUserFromSessionToken(sessionToken)
        : await getUser();
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=unauthorized`);
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Generate state for CSRF protection + platform info
    const stateData: StateData = {
      csrf: randomBytes(32).toString("hex"),
      platform: platform === "ios" ? "ios" : "web",
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

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
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_failed`);
  }
}
