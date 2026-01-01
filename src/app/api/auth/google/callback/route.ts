import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calendarDb } from "@/db/calendar";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { exchangeGoogleCode, getGoogleUserInfo } from "@/lib/google-calendar";

interface StateData {
  csrf: string;
  platform: "web" | "ios";
}

export async function GET(request: NextRequest) {
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

  // Helper to redirect based on platform
  const redirectWithError = (errorCode: string) => {
    if (isIOS) {
      return NextResponse.redirect(`maphealth://auth/callback?error=${errorCode}`);
    }
    return NextResponse.redirect(`${baseUrl}/auth/error?error=${errorCode}`);
  };

  const redirectWithSuccess = (sessionToken?: string) => {
    if (isIOS && sessionToken) {
      return NextResponse.redirect(`maphealth://auth/callback?token=${sessionToken}`);
    }
    return NextResponse.redirect(`${baseUrl}/`);
  };

  try {
    // Check for OAuth errors from Google
    if (error) {
      console.error("Google OAuth error:", error);
      return redirectWithError("oauth_denied");
    }

    // Validate code
    if (!code) {
      return redirectWithError("missing_code");
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get("google_oauth_state")?.value;
    if (!state || state !== storedState) {
      return redirectWithError("invalid_state");
    }

    // Exchange code for tokens
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const tokens = await exchangeGoogleCode(code, redirectUri);

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // Find or create user by Google ID
    let user = await db.query.users.findFirst({
      where: eq(users.googleId, userInfo.sub),
    });

    if (!user) {
      // Check if user exists with this email (migration case)
      const existingByEmail = await db.query.users.findFirst({
        where: eq(users.email, userInfo.email),
      });

      if (existingByEmail) {
        // Link existing account to Google ID and update profile
        const [updated] = await db
          .update(users)
          .set({
            googleId: userInfo.sub,
            displayName: userInfo.name ?? existingByEmail.displayName,
            firstName: userInfo.given_name ?? existingByEmail.firstName,
            lastName: userInfo.family_name ?? existingByEmail.lastName,
            profilePhotoUrl: userInfo.picture ?? existingByEmail.profilePhotoUrl,
            locale: userInfo.locale ?? existingByEmail.locale,
          })
          .where(eq(users.id, existingByEmail.id))
          .returning();
        user = updated;
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            email: userInfo.email,
            googleId: userInfo.sub,
            displayName: userInfo.name ?? null,
            firstName: userInfo.given_name ?? null,
            lastName: userInfo.family_name ?? null,
            profilePhotoUrl: userInfo.picture ?? null,
            locale: userInfo.locale ?? null,
          })
          .returning();
        user = newUser;
      }
    } else {
      // Update profile info on every login (keep profile fresh from Google)
      const [updated] = await db
        .update(users)
        .set({
          email: userInfo.email, // Email may have changed
          displayName: userInfo.name ?? user.displayName,
          firstName: userInfo.given_name ?? user.firstName,
          lastName: userInfo.family_name ?? user.lastName,
          profilePhotoUrl: userInfo.picture ?? user.profilePhotoUrl,
          locale: userInfo.locale ?? user.locale,
        })
        .where(eq(users.id, user.id))
        .returning();
      user = updated;
    }

    // Store Google integration for calendar access
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

    // Get the user's calendars
    const calendarListResponse = await calendar.calendarList.list({
      maxResults: 250,
    });

    const calendars = calendarListResponse.data.items ?? [];
    const primaryCalendar = calendars.find((c) => c.primary);
    const userEmail = primaryCalendar?.id ?? userInfo.email;

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

    // Create session (skip cookie for iOS - they use Bearer token)
    const sessionToken = await createSession(user.id, { skipCookie: isIOS });

    // Clear state cookie
    const response = redirectWithSuccess(isIOS ? sessionToken : undefined);
    response.cookies.delete("google_oauth_state");

    return response;
  } catch (err) {
    console.error("Google callback error:", err);
    return redirectWithError("callback_failed");
  }
}
