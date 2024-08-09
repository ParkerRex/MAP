import type { Credentials } from "google-auth-library";
import type { calendar_v3 } from "googleapis";

import type {
  AclRequest,
  CalendarRequest,
  CreateCalendarRequest,
  CreateEventRequest,
  EventRequest,
  GetEventsRequest,
  ProviderParams,
  SettingRequest,
} from "types";
import { GoogleCalendarApi } from "./gcal-api";

export class GoogleCalendarProvider {
  private api: GoogleCalendarApi;

  constructor(params: ProviderParams) {
    this.api = new GoogleCalendarApi(params);
  }

  // ACL methods
  async getAcl(params: AclRequest): Promise<calendar_v3.Schema$AclRule> {
    return this.api.getAcl(params);
  }

  async listAcl(params: AclRequest): Promise<calendar_v3.Schema$Acl> {
    return this.api.listAcl(params);
  }

  async insertAcl(params: AclRequest): Promise<calendar_v3.Schema$AclRule> {
    return this.api.insertAcl(params);
  }

  async updateAcl(params: AclRequest): Promise<calendar_v3.Schema$AclRule> {
    return this.api.updateAcl(params);
  }

  async deleteAcl(params: AclRequest): Promise<void> {
    return this.api.deleteAcl(params);
  }

  // Calendar List methods
  async getCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$Get,
  ): Promise<calendar_v3.Schema$CalendarListEntry> {
    return this.api.getCalendarList(params);
  }

  async listCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$List,
  ): Promise<calendar_v3.Schema$CalendarList> {
    return this.api.listCalendarList(params);
  }

  async insertCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$Insert,
  ): Promise<calendar_v3.Schema$CalendarListEntry> {
    return this.api.insertCalendarList(params);
  }

  async updateCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$Update,
  ): Promise<calendar_v3.Schema$CalendarListEntry> {
    return this.api.updateCalendarList(params);
  }

  async deleteCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$Update,
  ): Promise<void> {
    return this.api.deleteCalendarList(params);
  }

  // Calendar methods
  async getCalendar(
    params: CalendarRequest,
  ): Promise<calendar_v3.Schema$Calendar> {
    return this.api.getCalendar(params);
  }

  async createCalendar(
    params: CreateCalendarRequest,
  ): Promise<calendar_v3.Schema$Calendar> {
    return this.api.insertCalendar({
      requestBody: {
        summary: params.summary,
        description: params.description,
        timeZone: params.timeZone,
      },
    });
  }

  async updateCalendar(
    params: CalendarRequest,
  ): Promise<calendar_v3.Schema$Calendar> {
    return this.api.updateCalendar(params);
  }

  async deleteCalendar(params: CalendarRequest): Promise<void> {
    return this.api.deleteCalendar(params);
  }

  // Event methods
  async getEvent(params: EventRequest): Promise<calendar_v3.Schema$Event> {
    return this.api.getEvent(params);
  }

  async getEvents(
    params: GetEventsRequest,
  ): Promise<calendar_v3.Schema$Events> {
    return this.api.listEvents(params);
  }

  async createEvent(
    params: CreateEventRequest,
  ): Promise<calendar_v3.Schema$Event> {
    return this.api.insertEvent({
      calendarId: params.calendarId,
      requestBody: params.event,
    });
  }

  async updateEvent(params: EventRequest): Promise<calendar_v3.Schema$Event> {
    return this.api.updateEvent(params);
  }

  async deleteEvent(params: EventRequest): Promise<void> {
    return this.api.deleteEvent(params);
  }

  // Colors method
  async getColors(): Promise<calendar_v3.Schema$Colors> {
    return this.api.getColors();
  }

  // FreeBusy method
  async queryFreeBusy(
    params: calendar_v3.Params$Resource$Freebusy$Query,
  ): Promise<calendar_v3.Schema$FreeBusyResponse> {
    return this.api.queryFreeBusy(params);
  }

  // Settings methods
  async getSetting(
    params: SettingRequest,
  ): Promise<calendar_v3.Schema$Setting> {
    return this.api.getSetting(params);
  }
  async listSettings(): Promise<calendar_v3.Schema$Settings> {
    return this.api.listSettings();
  }
  // Channel methods
  async watchEvents(
    params: calendar_v3.Params$Resource$Events$Watch,
  ): Promise<calendar_v3.Schema$Channel> {
    return this.api.watchEvents(params);
  }
  async stopChannel(
    params: calendar_v3.Params$Resource$Channels$Stop,
  ): Promise<void> {
    return this.api.stopChannel(params);
  }
  // Helper methods
  async getAuthUrl(scopes: string[]): Promise<string> {
    return this.api.getAuthUrl(scopes);
  }
  async exchangeCode(code: string): Promise<Credentials> {
    return this.api.exchangeCode(code);
  }
}
