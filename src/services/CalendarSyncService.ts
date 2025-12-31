import { google } from "googleapis";
import { calendarDb } from "@/db/calendar";
import { subMonths, addMonths } from "date-fns";
import { mapGoogleEventToDb } from "@/lib/google-calendar";

export class CalendarSyncService {
  async syncCalendar(userId: string) {
    const integration = await calendarDb.getIntegration(userId, "GOOGLE");

    if (!integration) {
      throw new Error("No Google integration found");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken ?? undefined,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const calendarListResponse = await calendar.calendarList.list({
      maxResults: 250,
    });

    const calendars = calendarListResponse.data.items || [];
    const timeMin = subMonths(new Date(), 6).toISOString();
    const timeMax = addMonths(new Date(), 6).toISOString();

    for (const cal of calendars) {
      if (!cal.id) continue;

      const eventsResponse = await calendar.events.list({
        calendarId: cal.id,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 2500,
      });

      const events = eventsResponse.data.items || [];

      for (const event of events) {
        if (!event.id) continue;

        const eventData = mapGoogleEventToDb(event, cal.id);
        const existing = await calendarDb.getEventById(event.id, cal.id);

        if (existing) {
          await calendarDb.updateEvent(event.id, cal.id, eventData);
        } else {
          await calendarDb.createEvent(eventData);
        }
      }
    }

    await calendarDb.createSyncLog({
      userId,
      status: "success",
      message: `Synced ${calendars.length} calendars`,
    });
  }
}
