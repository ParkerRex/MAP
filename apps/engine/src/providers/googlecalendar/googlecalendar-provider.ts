import type { calendar_v3 } from "googleapis";
import type { CalendarProvider } from "../interface";
import type {
  AclRequest,
  AclResponse,
  CalendarListRequest,
  CalendarListResponse,
  CalendarRequest,
  CalendarResponse,
  ChannelRequest,
  ChannelResponse,
  ColorsResponse,
  CreateCalendarRequest,
  CreateEventRequest,
  DeleteCalendarRequest,
  DeleteEventRequest,
  EventRequest,
  EventResponse,
  FreeBusyRequest,
  FreeBusyResponse,
  GetCalendarsResponse,
  GetEventsRequest,
  GetEventsResponse,
  ProviderParams,
  SettingRequest,
  SettingResponse,
  UpdateEventRequest,
} from "../types";
import { GoogleCalendarApi } from "./googlecalendar-api";

export class GoogleCalendarProvider implements CalendarProvider {
  private api: GoogleCalendarApi;

  constructor(params: ProviderParams) {
    this.api = new GoogleCalendarApi(params);
  }

  // ACL methods
  async getAcl(params: AclRequest): Promise<AclResponse> {
    return this.api.getAcl(params);
  }

  async listAcl(params: AclRequest): Promise<AclResponse> {
    return this.api.listAcl(params);
  }

  async insertAcl(params: AclRequest): Promise<AclResponse> {
    return this.api.insertAcl(params);
  }

  async updateAcl(params: AclRequest): Promise<AclResponse> {
    return this.api.updateAcl(params);
  }

  async deleteAcl(params: AclRequest): Promise<void> {
    await this.api.deleteAcl(params);
  }

  // Calendar List methods
  async getCalendarList(
    params: CalendarListRequest,
  ): Promise<CalendarListResponse> {
    return this.api.getCalendarList(params);
  }

  async listCalendarList(
    params: CalendarListRequest,
  ): Promise<CalendarListResponse> {
    return this.api.listCalendarList(params);
  }

  async insertCalendarList(
    params: CalendarListRequest,
  ): Promise<CalendarListResponse> {
    return this.api.insertCalendarList(params);
  }

  async updateCalendarList(
    params: CalendarListRequest,
  ): Promise<CalendarListResponse> {
    return this.api.updateCalendarList(params);
  }

  async deleteCalendarList(params: CalendarListRequest): Promise<void> {
    await this.api.deleteCalendarList(params);
  }

  // Calendars methods
  async getCalendar(params: CalendarRequest): Promise<CalendarResponse> {
    return this.api.getCalendar(params);
  }

  async createCalendar(
    params: CreateCalendarRequest,
  ): Promise<calendar_v3.Schema$Calendar> {
    return this.api.insertCalendar(params);
  }

  async updateCalendar(params: CalendarRequest): Promise<CalendarResponse> {
    return this.api.updateCalendar(params);
  }

  async deleteCalendar(params: DeleteCalendarRequest): Promise<void> {
    await this.api.deleteCalendar(params);
  }

  // Events methods
  async getEvents(params: GetEventsRequest): Promise<GetEventsResponse> {
    return this.api.listEvents(params);
  }

  async createEvent(
    params: CreateEventRequest,
  ): Promise<calendar_v3.Schema$Event> {
    return this.api.insertEvent(params);
  }

  async updateEvent(
    params: UpdateEventRequest,
  ): Promise<calendar_v3.Schema$Event> {
    return this.api.updateEvent(params);
  }

  async deleteEvent(params: DeleteEventRequest): Promise<void> {
    await this.api.deleteEvent(params);
  }

  // Colors method
  async getColors(): Promise<ColorsResponse> {
    return this.api.getColors();
  }

  // FreeBusy method
  async queryFreebusy(params: FreeBusyRequest): Promise<FreeBusyResponse> {
    return this.api.queryFreebusy(params);
  }

  // Settings methods
  async getSetting(params: SettingRequest): Promise<SettingResponse> {
    return this.api.getSetting(params);
  }

  async listSettings(): Promise<SettingResponse> {
    return this.api.listSettings();
  }

  // Channel methods
  async watchCalendar(params: ChannelRequest): Promise<ChannelResponse> {
    return this.api.watchCalendar(params);
  }

  async stopChannel(params: ChannelRequest): Promise<void> {
    await this.api.stopChannel(params);
  }

  // Add these methods for auth functionality
  async getAuthUrl(scopes: string[]): Promise<string> {
    return this.api.getAuthUrl(scopes);
  }

  async exchangeCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  }> {
    return this.api.exchangeCode(code);
  }
}
