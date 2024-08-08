import { ProviderError } from "@/utils/error";
import { isError } from "@/utils/error";
import type { Credentials } from "google-auth-library";
import { type calendar_v3, google } from "googleapis";
import type { ProviderParams } from "../types";
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
  EventRequest,
  EventResponse,
  FreeBusyRequest,
  FreeBusyResponse,
  SettingRequest,
  SettingResponse,
} from "./types";

export class GoogleCalendarApi {
  private calendar: calendar_v3.Calendar;
  private kv?: KVNamespace;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(params: Omit<ProviderParams, "provider">) {
    const { clientId, clientSecret, redirectUri, refreshToken, kv } = params;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    auth.setCredentials({ refresh_token: refreshToken });
    this.calendar = google.calendar({ version: "v3", auth });
    this.kv = kv;
  }

  // ACL methods
  async getAcl(params: AclRequest): Promise<AclResponse> {
    try {
      const response = await this.calendar.acl.get(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listAcl(params: AclRequest): Promise<AclResponse> {
    try {
      const response = await this.calendar.acl.list(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async insertAcl(params: AclRequest): Promise<AclResponse> {
    try {
      const response = await this.calendar.acl.insert(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateAcl(params: AclRequest): Promise<AclResponse> {
    try {
      const response = await this.calendar.acl.update(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteAcl(params: AclRequest): Promise<void> {
    try {
      await this.calendar.acl.delete(params);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Calendar List methods
  async getCalendarList(
    params: CalendarListRequest,
  ): Promise<CalendarListResponse> {
    try {
      const response = await this.calendar.calendarList.get(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listCalendarList(
    params: CalendarListRequest,
  ): Promise<CalendarListResponse> {
    try {
      const response = await this.calendar.calendarList.list(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async insertCalendarList(
    params: CalendarListRequest,
  ): Promise<CalendarListResponse> {
    try {
      const response = await this.calendar.calendarList.insert(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateCalendarList(
    params: CalendarListRequest,
  ): Promise<CalendarListResponse> {
    try {
      const response = await this.calendar.calendarList.update(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteCalendarList(params: CalendarListRequest): Promise<void> {
    try {
      await this.calendar.calendarList.delete(params);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Calendars methods
  async getCalendar(params: CalendarRequest): Promise<CalendarResponse> {
    try {
      const response = await this.calendar.calendars.get(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async insertCalendar(params: CalendarRequest): Promise<CalendarResponse> {
    try {
      const response = await this.calendar.calendars.insert(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateCalendar(params: CalendarRequest): Promise<CalendarResponse> {
    try {
      const response = await this.calendar.calendars.update(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteCalendar(params: CalendarRequest): Promise<void> {
    try {
      await this.calendar.calendars.delete(params);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Events methods
  async getEvent(params: EventRequest): Promise<EventResponse> {
    try {
      const response = await this.calendar.events.get(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listEvents(params: EventRequest): Promise<EventResponse> {
    try {
      const response = await this.calendar.events.list(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async insertEvent(params: EventRequest): Promise<EventResponse> {
    try {
      const response = await this.calendar.events.insert(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateEvent(params: EventRequest): Promise<EventResponse> {
    try {
      const response = await this.calendar.events.update(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteEvent(params: EventRequest): Promise<void> {
    try {
      await this.calendar.events.delete(params);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Colors method
  async getColors(): Promise<ColorsResponse> {
    try {
      const response = await this.calendar.colors.get();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // FreeBusy method
  async queryFreebusy(params: FreeBusyRequest): Promise<FreeBusyResponse> {
    try {
      const response = await this.calendar.freebusy.query(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Settings methods
  async getSetting(params: SettingRequest): Promise<SettingResponse> {
    try {
      const response = await this.calendar.settings.get(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listSettings(): Promise<SettingResponse> {
    try {
      const response = await this.calendar.settings.list();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Channel methods
  async watchCalendar(params: ChannelRequest): Promise<ChannelResponse> {
    try {
      const response = await this.calendar.events.watch(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async stopChannel(params: ChannelRequest): Promise<void> {
    try {
      await this.calendar.channels.stop(params);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAuthUrl(scopes: string[]): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
  }

  async exchangeCode(code: string): Promise<Credentials> {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  private handleError(error: unknown): never {
    const errorDetails = isError(error);
    if (errorDetails) {
      throw new ProviderError(errorDetails.message, errorDetails.code);
    }
    throw new ProviderError("An unknown error occurred", "UNKNOWN_ERROR");
  }
}
