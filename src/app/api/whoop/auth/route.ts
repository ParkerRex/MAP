import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { getWhoopAuthUrl } from "@/lib/whoop";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    // Generate state for CSRF protection
    const state = randomBytes(32).toString("hex");

    // Store state in a cookie for verification
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/whoop/callback`;
    const authUrl = getWhoopAuthUrl(state, redirectUri);

    const response = NextResponse.redirect(authUrl);

    // Set state cookie for verification in callback
    response.cookies.set("whoop_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
