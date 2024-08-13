import type { Credentials, OAuth2Client } from "google-auth-library";
import { type calendar_v3, google } from "googleapis";

export class GoogleCalendarApi {
  private calendar: calendar_v3.Calendar;
  private auth: OAuth2Client;

  constructor() {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    this.calendar = google.calendar({ version: "v3", auth: this.auth });
  }

  setCredentials(credentials: Credentials) {
    this.auth.setCredentials(credentials);
  }

  // Calendar List methods
  async getCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$List = {},
  ): Promise<calendar_v3.Schema$CalendarList> {
    const response = await this.calendar.calendarList.list(params);
    return response.data;
  }

  // Event methods
  async getEvents(
    params: calendar_v3.Params$Resource$Events$List,
  ): Promise<calendar_v3.Schema$Events> {
    const response = await this.calendar.events.list(params);
    return response.data;
  }

  async createEvent(
    params: calendar_v3.Params$Resource$Events$Insert,
  ): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.insert(params);
    return response.data;
  }

  async updateEvent(
    params: calendar_v3.Params$Resource$Events$Update,
  ): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.update(params);
    return response.data;
  }

  async deleteEvent(
    params: calendar_v3.Params$Resource$Events$Delete,
  ): Promise<void> {
    await this.calendar.events.delete(params);
  }

  // Calendar methods
  async deleteCalendar(
    params: calendar_v3.Params$Resource$Calendars$Delete,
  ): Promise<void> {
    await this.calendar.calendars.delete(params);
  }

  async updateCalendar(
    params: calendar_v3.Params$Resource$Calendars$Update,
  ): Promise<calendar_v3.Schema$Calendar> {
    const response = await this.calendar.calendars.update(params);
    return response.data;
  }

  // Calendar Resources methods
  async getCalendarResources(
    params: calendar_v3.Params$Resource$Freebusy$Query,
  ): Promise<calendar_v3.Schema$FreeBusyResponse> {
    const response = await this.calendar.freebusy.query(params);
    return response.data;
  }

  // Colors methods
  async getColors(): Promise<calendar_v3.Schema$Colors> {
    const response = await this.calendar.colors.get();
    return response.data;
  }

  // Webhook methods
  async watchEvents(
    params: calendar_v3.Params$Resource$Events$Watch,
  ): Promise<calendar_v3.Schema$Channel> {
    const response = await this.calendar.events.watch(params);
    return response.data;
  }

  async stopChannel(
    params: calendar_v3.Params$Resource$Channels$Stop,
  ): Promise<void> {
    await this.calendar.channels.stop(params);
  }
}
