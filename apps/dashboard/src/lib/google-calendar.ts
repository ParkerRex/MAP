import { google } from "googleapis";
import { createClient } from "@map/supabase/server";
import { calendarDb } from "@/db/calendar";

export async function getGoogleCalendarClient() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    throw new Error("No Google token available");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: session.provider_token,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function getGoogleCalendarClientWithRefresh(userId: string) {
  const integration = await calendarDb.getIntegration(userId, "GOOGLE");

  if (!integration) {
    throw new Error("No Google integration found");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
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
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        await calendarDb.updateIntegration(userId, "GOOGLE", {
          accessToken: credentials.access_token ?? integration.accessToken,
          expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : undefined,
        });

        oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error("Failed to refresh token:", error);
        throw new Error("Failed to refresh Google token");
      }
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export function mapGoogleEventToDb(event: any, calendarId: string) {
  return {
    id: event.id,
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
