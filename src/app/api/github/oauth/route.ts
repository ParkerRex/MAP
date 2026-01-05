import { randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { handleApiError } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { getGitHubAuthUrl } from "@/lib/github";

interface StateData {
  csrf: string;
  platform: "web" | "ios";
}

async function getUserFromSessionToken(token: string) {
  const result = await db
    .select({ id: users.id })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return result[0] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const sessionToken = searchParams.get("token");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const host = appUrl ? new URL(appUrl).hostname : "";
    const cookieDomain = host.endsWith("mapyourlife.org") ? ".mapyourlife.org" : undefined;

    const user =
      sessionToken && platform === "ios"
        ? await getUserFromSessionToken(sessionToken)
        : await getUser();
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=unauthorized`);
    }

    const stateData: StateData = {
      csrf: randomBytes(32).toString("hex"),
      platform: platform === "ios" ? "ios" : "web",
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`;
    const authUrl = getGitHubAuthUrl(state, redirectUri);

    const response = NextResponse.redirect(authUrl);

    response.cookies.set("github_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    response.cookies.set("github_oauth_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
