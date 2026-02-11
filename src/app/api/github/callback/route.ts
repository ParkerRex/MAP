import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calendarDb } from "@/db/calendar";
import { users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { exchangeGitHubCode, getGitHubUser } from "@/lib/github";

interface StateData {
  csrf: string;
  platform: "web" | "ios";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  let stateData: StateData = { csrf: "", platform: "web" };
  try {
    if (state) {
      stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    }
  } catch {
    // Keep defaults
  }

  const isIOS = stateData.platform === "ios";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const redirectWithError = (errorCode: string) => {
    if (isIOS) {
      return NextResponse.redirect(`maphealth://github/callback?error=${errorCode}`);
    }
    return NextResponse.redirect(`${baseUrl}/settings?github=error&reason=${errorCode}`);
  };

  const redirectWithSuccess = () => {
    if (isIOS) {
      return NextResponse.redirect("maphealth://github/callback?success=1");
    }
    return NextResponse.redirect(`${baseUrl}/settings?github=connected`);
  };

  try {
    if (error) {
      console.error("GitHub OAuth error:", error);
      return redirectWithError("oauth_denied");
    }

    if (!code) {
      return redirectWithError("missing_code");
    }

    const storedState = request.cookies.get("github_oauth_state")?.value;
    if (!state || state !== storedState) {
      return redirectWithError("invalid_state");
    }

    const userIdFromCookie = request.cookies.get("github_oauth_user")?.value;
    const userFromSession = await getUser();
    const userId = userIdFromCookie ?? userFromSession?.id;

    if (!userId) {
      return redirectWithError("unauthorized");
    }

    const redirectUri = `${baseUrl}/api/github/callback`;
    const tokens = await exchangeGitHubCode(code, redirectUri);

    const githubUser = await getGitHubUser(tokens.access_token);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : undefined;

    await calendarDb.upsertIntegration({
      userId,
      provider: "GITHUB",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });

    if (githubUser.login) {
      await db.update(users).set({ githubUsername: githubUser.login }).where(eq(users.id, userId));
    }

    const response = redirectWithSuccess();
    response.cookies.delete("github_oauth_state");
    response.cookies.delete("github_oauth_user");

    return response;
  } catch (err) {
    console.error("GitHub callback error:", err);
    return redirectWithError("callback_failed");
  }
}
