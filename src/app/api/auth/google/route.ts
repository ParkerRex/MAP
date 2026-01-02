import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get("platform"); // "ios" or undefined (web)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const host = appUrl ? new URL(appUrl).hostname : "";
  const cookieDomain = host.endsWith("mapyourlife.org") ? ".mapyourlife.org" : undefined;

  // Generate state for CSRF protection + platform info
  const stateData = {
    csrf: randomBytes(32).toString("hex"),
    platform: platform === "ios" ? "ios" : "web",
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  // Generate OAuth URL
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  const authUrl = getGoogleAuthUrl(state, redirectUri);

  const response = NextResponse.redirect(authUrl);

  // Set state cookie for verification in callback
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return response;
}
