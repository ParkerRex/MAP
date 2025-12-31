import { type NextRequest, NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";
import { exchangeWhoopCode } from "@/lib/whoop";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=unauthorized`);
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("WHOOP OAuth error:", error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/health?error=oauth_denied`);
    }

    // Validate code
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/health?error=missing_code`);
    }

    // Verify state
    const storedState = request.cookies.get("whoop_oauth_state")?.value;
    if (!state || state !== storedState) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/health?error=invalid_state`);
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/whoop/callback`;
    const tokens = await exchangeWhoopCode(code, redirectUri);

    // Store integration
    await calendarDb.upsertIntegration({
      userId: user.id,
      provider: "WHOOP",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });

    // Clear state cookie and redirect to health page
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/health?success=connected`,
    );
    response.cookies.delete("whoop_oauth_state");

    return response;
  } catch (error) {
    console.error("WHOOP callback error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/health?error=callback_failed`);
  }
}
