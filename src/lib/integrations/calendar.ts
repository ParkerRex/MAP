import { type calendar_v3, google } from "googleapis";
import type { CalendarEvent, Calendar } from "@/types";

export class CalendarClient {
  private calendar: calendar_v3.Calendar;
  private timeZone: string;
  private userId: string;

  constructor(accessToken: string, timeZone: string, userId: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.calendar = google.calendar({ version: "v3", auth });
    this.timeZone = timeZone;
    this.userId = userId;
  }

  async listCalendars(): Promise<Calendar[]> {
    const response = await this.calendar.calendarList.list();
    return response.data.items || [];
  }

  async getCalendar(calendarId: string): Promise<Calendar | null> {
    try {
      const response = await this.calendar.calendars.get({ calendarId });
      return response.data as Calendar;
    } catch (error) {
      console.error(`Error fetching calendar ${calendarId}:`, error);
      return null;
    }
  }

  async getCalendarEvents(
    calendarId: string,
    timeMin?: Date | null,
    timeMax?: Date | null,
    syncToken?: string | null,
  ): Promise<{
    events: CalendarEvent[];
    nextSyncToken: string | undefined;
  }> {
    try {
      const params: calendar_v3.Params$Resource$Events$List = {
        calendarId,
        singleEvents: true,
        showDeleted: true,
        orderBy: "updated",
      };

      if (syncToken) {
        params.syncToken = syncToken;
      } else {
        if (timeMin) params.timeMin = timeMin.toISOString();
        if (timeMax) params.timeMax = timeMax.toISOString();
      }

      const response = await this.calendar.events.list(params);

      return {
        events: response.data.items as CalendarEvent[],
        nextSyncToken: response.data.nextSyncToken || undefined,
      };
    } catch (error) {
      console.error(`Error fetching events for calendar ${calendarId}:`, error);
      throw error;
    }
  }

  async createCalendarEvent(
    calendarId: string,
    event: calendar_v3.Schema$Event,
  ): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    return response.data;
  }

  async updateCalendarEvent(
    calendarId: string,
    eventId: string,
    event: calendar_v3.Schema$Event,
  ): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });
    return response.data;
  }

  async deleteCalendarEvent(
    calendarId: string,
    eventId: string,
  ): Promise<void> {
    await this.calendar.events.delete({
      calendarId,
      eventId,
    });
  }

  async setupPushNotifications(
    calendarId: string,
    channelId: string,
    webhookUrl: string,
  ): Promise<{ resourceId: string; expiration: string } | null> {
    try {
      if (!/^[A-Za-z0-9\-_\+/=]+$/.test(channelId)) {
        throw new Error("Invalid channel ID format");
      }

      const response = await this.calendar.events.watch({
        calendarId,
        requestBody: {
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
        },
      });

      return {
        resourceId: response.data.resourceId as string,
        expiration: response.data.expiration as string,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "Push notifications are not supported by this resource."
      ) {
        console.log(
          `Push notifications not supported for calendar: ${calendarId}`,
        );
        return null;
      }
      throw error;
    }
  }

  async stopPushNotifications(
    channelId: string,
    resourceId: string,
  ): Promise<void> {
    await this.calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId,
      },
    });
  }

  async getNewSyncToken(calendarId: string): Promise<string | undefined> {
    const response = await this.calendar.events.list({
      calendarId,
      maxResults: 1,
    });
    return response.data.nextSyncToken || undefined;
  }
}
