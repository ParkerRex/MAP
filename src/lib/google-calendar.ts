import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";
import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";

// Google Calendar OAuth Scopes
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

// Generate OAuth authorization URL
export function getGoogleAuthUrl(state: string, redirectUri: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [...GOOGLE_CALENDAR_SCOPES],
    state,
    prompt: "consent", // Force consent to ensure we get refresh token
  });
}

// Exchange authorization code for tokens
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Failed to get access token from Google");
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? "",
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
  };
}

async function createOAuth2ClientWithRefresh(
  userId: string,
  integration: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  },
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken ?? undefined,
  });

  // Check if token needs refresh
  if (integration.expiresAt) {
    const expiresAt = new Date(integration.expiresAt);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow && integration.refreshToken) {
      const { credentials } = await oauth2Client.refreshAccessToken();

      await calendarDb.updateIntegration(userId, "GOOGLE", {
        accessToken: credentials.access_token ?? integration.accessToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      });

      oauth2Client.setCredentials(credentials);
    }
  }

  return oauth2Client;
}

export async function getGoogleCalendarClient() {
  const user = await getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const integration = await calendarDb.getIntegration(user.id, "GOOGLE");

  if (!integration) {
    throw new Error("No Google integration found");
  }

  const oauth2Client = await createOAuth2ClientWithRefresh(user.id, integration);

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function getGoogleCalendarClientWithRefresh(userId: string) {
  const integration = await calendarDb.getIntegration(userId, "GOOGLE");

  if (!integration) {
    throw new Error("No Google integration found");
  }

  const oauth2Client = await createOAuth2ClientWithRefresh(userId, integration);

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export function mapGoogleEventToDb(event: calendar_v3.Schema$Event, calendarId: string) {
  return {
    id: event.id!,
    calendarId,
    summary: event.summary ?? null,
    description: event.description ?? null,
    location: event.location ?? null,
    startTime: event.start?.dateTime ?? null,
    endTime: event.end?.dateTime ?? null,
    startDate: event.start?.date ?? null,
    endDate: event.end?.date ?? null,
    isAllDay: !!event.start?.date,
    colorId: event.colorId ?? null,
    status: event.status ?? null,
    creatorEmail: event.creator?.email ?? null,
    organizerEmail: event.organizer?.email ?? null,
    etag: event.etag ?? null,
    iCalUid: event.iCalUID ?? null,
    visibility: event.visibility ?? null,
    transparency: event.transparency ?? null,
    sequence: event.sequence ?? null,
    recurringEventId: event.recurringEventId ?? null,
    originalStartTime: event.originalStartTime?.dateTime ?? event.originalStartTime?.date ?? null,
    recurrence: event.recurrence ?? null,
    guestsCanInviteOthers: event.guestsCanInviteOthers ?? null,
    guestsCanModify: event.guestsCanModify ?? null,
    guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests ?? null,
    created: event.created ?? null,
    updated: event.updated ?? null,
  };
}
