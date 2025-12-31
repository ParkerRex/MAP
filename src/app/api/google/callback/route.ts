import { google } from "googleapis";
import { type NextRequest, NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";
import { exchangeGoogleCode } from "@/lib/google-calendar";

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
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/calendar?error=oauth_denied`,
      );
    }

    // Validate code
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/calendar?error=missing_code`,
      );
    }

    // Verify state
    const storedState = request.cookies.get("google_oauth_state")?.value;
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/calendar?error=invalid_state`,
      );
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;
    const tokens = await exchangeGoogleCode(code, redirectUri);

    // Store integration
    await calendarDb.upsertIntegration({
      userId: user.id,
      provider: "GOOGLE",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
    });

    // Fetch and persist calendar list from Google
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Get the user's email from the primary calendar
    const calendarListResponse = await calendar.calendarList.list({
      maxResults: 250,
    });

    const calendars = calendarListResponse.data.items ?? [];
    const primaryCalendar = calendars.find((c) => c.primary);
    const userEmail = primaryCalendar?.id ?? user.email;

    // Create/update calendar account
    const account = await calendarDb.upsertCalendarAccount({
      userId: user.id,
      email: userEmail,
      provider: "GOOGLE",
    });

    // Persist all calendars
    for (const cal of calendars) {
      if (!cal.id) continue;

      await calendarDb.upsertCalendar({
        id: cal.id,
        accountId: account.id,
        provider: "GOOGLE",
        summary: cal.summary ?? null,
        description: cal.description ?? null,
        backgroundColor: cal.backgroundColor ?? null,
        foregroundColor: cal.foregroundColor ?? null,
        colorId: cal.colorId ?? null,
        selected: cal.selected ?? true,
        isPrimary: cal.primary ?? false,
        accessRole: cal.accessRole ?? null,
        timeZone: cal.timeZone ?? null,
        etag: cal.etag ?? null,
        kind: cal.kind ?? null,
      });
    }

    // Clear state cookie and redirect to calendar page
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/calendar?success=connected`,
    );
    response.cookies.delete("google_oauth_state");

    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/calendar?error=callback_failed`,
    );
  }
}
