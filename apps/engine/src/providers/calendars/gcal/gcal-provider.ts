import type { Env } from "@/common/bindings";
import type { ProviderParams } from "types";
import { GoogleCalendarApi } from "./gcal-api";

export class GoogleCalendarProvider {
  private api: GoogleCalendarApi;

  constructor(params: { envs: Env; accessToken: string }) {
    const { envs, accessToken } = params;
    this.api = new GoogleCalendarApi({
      clientId: envs.GOOGLE_CLIENT_ID,
      clientSecret: envs.GOOGLE_CLIENT_SECRET,
      redirectUri: envs.GOOGLE_REDIRECT_URI,
      refreshToken: accessToken,
    });
  }

  async getCalendarList(params: { maxResults?: number; syncToken?: string }) {
    return this.api.getCalendarList(params);
  }

  async getEvents(params: {
    calendarId: string;
    timeMin?: string;
    timeMax?: string;
    syncToken?: string;
  }) {
    return this.api.getEvents(params);
  }

  async updateEvent(params: {
    calendarId: string;
    eventId: string;
    resource: any;
  }) {
    return this.api.updateEvent(params);
  }

  async deleteEvent(params: { calendarId: string; eventId: string }) {
    return this.api.deleteEvent(params);
  }

  async deleteCalendar(params: { calendarId: string }) {
    return this.api.deleteCalendar(params);
  }

  async updateCalendar(params: { calendarId: string; resource: any }) {
    return this.api.updateCalendar(params);
  }

  async getCalendarResources(params: {
    timeMin: string;
    timeMax: string;
    items: { id: string }[];
  }) {
    return this.api.getCalendarResources(params);
  }

  async getColors() {
    return this.api.getColors();
  }

  async watchEvents(params: {
    calendarId: string;
    resource: {
      id: string;
      type: string;
      address: string;
    };
  }) {
    return this.api.watchEvents(params);
  }

  async stopChannel(params: { id: string; resourceId: string }) {
    return this.api.stopChannel(params);
  }
}
