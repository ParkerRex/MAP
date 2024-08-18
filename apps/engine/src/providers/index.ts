import type { CalendarSchema } from "@/routes/google-calendar/calendars/schema";
import type { z } from "zod";
import type {
  CalendarListEntrySchema,
  ChannelSchema,
} from "../routes/google-calendar/calendar-list/schema";
import type { EventSchema } from "../routes/google-calendar/events/schema";
import type { BodyMeasurementSchema } from "../routes/whoop/body-measurements/schema";
import { GoogleCalendarProvider } from "./google-calendar/google-calendar-provider";
import type { ProviderParams } from "./types";
import { WhoopProvider } from "./whoop/whoop-provider";

export class Provider {
  #provider: GoogleCalendarProvider | WhoopProvider;

  constructor(params: ProviderParams) {
    switch (params.provider) {
      case "google-calendar":
        this.#provider = new GoogleCalendarProvider(params);
        break;
      case "whoop":
        this.#provider = new WhoopProvider(params);
        break;
      default:
        throw new Error(`Unsupported provider: ${params.provider}`);
    }
  }
  // Google Calendar methods
  async getAcl(calendarId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.getAcl(calendarId);
    }
    throw new Error("Method not supported for this provider");
  }

  async getCalendarList(params?: Record<string, unknown>) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.getCalendarList();
    }
    throw new Error("Method not supported for this provider");
  }

  async getCalendarListEntry(calendarId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.getCalendarListEntry(calendarId);
    }
    throw new Error("Method not supported for this provider");
  }

  async insertCalendarListEntry(
    calendarListEntry: z.infer<typeof CalendarListEntrySchema>,
  ) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.insertCalendarListEntry(calendarListEntry);
    }
    throw new Error("Method not supported for this provider");
  }

  async updateCalendarListEntry(
    calendarId: string,
    calendarListEntry: z.infer<typeof CalendarListEntrySchema>,
  ) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.updateCalendarListEntry(
        calendarId,
        calendarListEntry,
      );
    }
    throw new Error("Method not supported for this provider");
  }

  async deleteCalendarListEntry(calendarId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.deleteCalendarListEntry(calendarId);
    }
    throw new Error("Method not supported for this provider");
  }

  async getCalendar(calendarId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.getCalendar(calendarId);
    }
    throw new Error("Method not supported for this provider");
  }

  async insertCalendar(calendar: z.infer<typeof CalendarSchema>) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.insertCalendar(calendar);
    }
    throw new Error("Method not supported for this provider");
  }

  async updateCalendar(
    calendarId: string,
    calendar: z.infer<typeof CalendarSchema>,
  ) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.updateCalendar(calendarId, calendar);
    }
    throw new Error("Method not supported for this provider");
  }

  async getEvents(calendarId: string, params: Record<string, unknown>) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.listEvents(calendarId, params);
    }
    throw new Error("Method not supported for this provider");
  }

  async createEvent(calendarId: string, event: z.infer<typeof EventSchema>) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.insertEvent(calendarId, event);
    }
    throw new Error("Method not supported for this provider");
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    event: z.infer<typeof EventSchema>,
  ) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.updateEvent(calendarId, eventId, event);
    }
    throw new Error("Method not supported for this provider");
  }

  async watchCalendarList(requestBody: z.infer<typeof ChannelSchema>) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.watchCalendarList(requestBody);
    }
    throw new Error("Method not supported for this provider");
  }

  async watchEvents(
    calendarId: string,
    requestBody: z.infer<typeof ChannelSchema>,
  ) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.watchEvents(calendarId, requestBody);
    }
    throw new Error("Method not supported for this provider");
  }

  async stopChannel(requestBody: z.infer<typeof ChannelSchema>) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.stopChannel(requestBody);
    }
    throw new Error("Method not supported for this provider");
  }

  async deleteCalendar(calendarId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.deleteCalendar(calendarId);
    }
    throw new Error("Method not supported for this provider");
  }

  async clearCalendar(calendarId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.clearCalendar(calendarId);
    }
    throw new Error("Method not supported for this provider");
  }

  async getEvent(calendarId: string, eventId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.getEvent(calendarId, eventId);
    }
    throw new Error("Method not supported for this provider");
  }

  async deleteEvent(calendarId: string, eventId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.deleteEvent(calendarId, eventId);
    }
    throw new Error("Method not supported for this provider");
  }

  async moveEvent(calendarId: string, eventId: string, destination: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.moveEvent(calendarId, eventId, destination);
    }
    throw new Error("Method not supported for this provider");
  }

  async getSettings() {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.getSettings();
    }
    throw new Error("Method not supported for this provider");
  }

  async getSetting(settingId: string) {
    if (this.#provider instanceof GoogleCalendarProvider) {
      return this.#provider.getSetting(settingId);
    }
    throw new Error("Method not supported for this provider");
  }

  // WHOOP methods
  async getProfile(accessToken: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getProfile(accessToken);
    }
    throw new Error("Method not supported for this provider");
  }

  async getCycles(accessToken: string, start: string, end: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getCycles(accessToken, start, end);
    }
    throw new Error("Method not supported for this provider");
  }

  async getWorkouts(accessToken: string, start: string, end: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getWorkouts(accessToken, start, end);
    }
    throw new Error("Method not supported for this provider");
  }

  async getRecoveries(accessToken: string, start: string, end: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getRecoveries(accessToken, start, end);
    }
    throw new Error("Method not supported for this provider");
  }

  async getSleeps(accessToken: string, start: string, end: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getSleeps(accessToken, start, end);
    }
    throw new Error("Method not supported for this provider");
  }

  async getBodyMeasurements(accessToken: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getBodyMeasurements(accessToken);
    }
    throw new Error("Method not supported for this provider");
  }

  async createBodyMeasurement(
    accessToken: string,
    measurement: z.infer<typeof BodyMeasurementSchema>,
  ) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.createBodyMeasurement(accessToken, measurement);
    }
    throw new Error("Method not supported for this provider");
  }

  async getActivities(accessToken: string, start: string, end: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getActivities(accessToken, start, end);
    }
    throw new Error("Method not supported for this provider");
  }

  async getTeams(accessToken: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getTeams(accessToken);
    }
    throw new Error("Method not supported for this provider");
  }

  async getTeamMembers(accessToken: string, teamId: string) {
    if (this.#provider instanceof WhoopProvider) {
      return this.#provider.getTeamMembers(accessToken, teamId);
    }
    throw new Error("Method not supported for this provider");
  }

  async refreshToken(refreshToken: string) {
    if (
      this.#provider instanceof GoogleCalendarProvider ||
      this.#provider instanceof WhoopProvider
    ) {
      return this.#provider.refreshToken(refreshToken);
    }
    throw new Error("Method not supported for this provider");
  }
}
