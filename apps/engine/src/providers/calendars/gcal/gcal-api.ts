import type { Credentials } from "google-auth-library";
import { type calendar_v3, google } from "googleapis";
import type { ProviderParams } from "types";
import { ProviderError, isError } from "utils/error";

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
  async getAcl(
    params: calendar_v3.Params$Resource$Acl$Get,
  ): Promise<calendar_v3.Schema$AclRule> {
    try {
      const response = await this.calendar.acl.get(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listAcl(
    params: calendar_v3.Params$Resource$Acl$List,
  ): Promise<calendar_v3.Schema$Acl> {
    try {
      const response = await this.calendar.acl.list(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async insertAcl(
    params: calendar_v3.Params$Resource$Acl$Insert,
  ): Promise<calendar_v3.Schema$AclRule> {
    try {
      const response = await this.calendar.acl.insert(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAcl(
    params: calendar_v3.Params$Resource$Acl$Update,
  ): Promise<calendar_v3.Schema$AclRule> {
    try {
      const response = await this.calendar.acl.update(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAcl(
    params: calendar_v3.Params$Resource$Acl$Delete,
  ): Promise<void> {
    try {
      await this.calendar.acl.delete(params);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Calendar List methods
  async getCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$Get,
  ): Promise<calendar_v3.Schema$CalendarListEntry> {
    try {
      const response = await this.calendar.calendarList.get(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$List,
  ): Promise<calendar_v3.Schema$CalendarList> {
    try {
      const response = await this.calendar.calendarList.list(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async insertCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$Insert,
  ): Promise<calendar_v3.Schema$CalendarListEntry> {
    try {
      const response = await this.calendar.calendarList.insert(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$Update,
  ): Promise<calendar_v3.Schema$CalendarListEntry> {
    try {
      const response = await this.calendar.calendarList.update(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$Delete,
  ): Promise<void> {
    try {
      await this.calendar.calendarList.delete(params);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Calendar methods
  async getCalendar(
    params: calendar_v3.Params$Resource$Calendars$Get,
  ): Promise<calendar_v3.Schema$Calendar> {
    try {
      const response = await this.calendar.calendars.get(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async insertCalendar(
    params: calendar_v3.Params$Resource$Calendars$Insert,
  ): Promise<calendar_v3.Schema$Calendar> {
    try {
      const response = await this.calendar.calendars.insert(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCalendar(
    params: calendar_v3.Params$Resource$Calendars$Update,
  ): Promise<calendar_v3.Schema$Calendar> {
    try {
      const response = await this.calendar.calendars.update(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCalendar(
    params: calendar_v3.Params$Resource$Calendars$Delete,
  ): Promise<void> {
    try {
      await this.calendar.calendars.delete(params);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Event methods
  async getEvent(
    params: calendar_v3.Params$Resource$Events$Get,
  ): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.get(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listEvents(
    params: calendar_v3.Params$Resource$Events$List,
  ): Promise<calendar_v3.Schema$Events> {
    try {
      const response = await this.calendar.events.list(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async insertEvent(
    params: calendar_v3.Params$Resource$Events$Insert,
  ): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.insert(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateEvent(
    params: calendar_v3.Params$Resource$Events$Update,
  ): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.update(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteEvent(
    params: calendar_v3.Params$Resource$Events$Delete,
  ): Promise<void> {
    try {
      await this.calendar.events.delete(params);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Colors method
  async getColors(): Promise<calendar_v3.Schema$Colors> {
    try {
      const response = await this.calendar.colors.get();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // FreeBusy method
  async queryFreeBusy(
    params: calendar_v3.Params$Resource$Freebusy$Query,
  ): Promise<calendar_v3.Schema$FreeBusyResponse> {
    try {
      const response = await this.calendar.freebusy.query(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Settings methods
  async getSetting(
    params: calendar_v3.Params$Resource$Settings$Get,
  ): Promise<calendar_v3.Schema$Setting> {
    try {
      const response = await this.calendar.settings.get(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listSettings(): Promise<calendar_v3.Schema$Settings> {
    try {
      const response = await this.calendar.settings.list();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Channel methods
  async watchEvents(
    params: calendar_v3.Params$Resource$Events$Watch,
  ): Promise<calendar_v3.Schema$Channel> {
    try {
      const response = await this.calendar.events.watch(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async stopChannel(
    params: calendar_v3.Params$Resource$Channels$Stop,
  ): Promise<void> {
    try {
      await this.calendar.channels.stop(params);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAuthUrl(scopes: string[]): Promise<string> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri,
      );
      return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async exchangeCode(code: string): Promise<Credentials> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri,
      );
      const { tokens } = await oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    const errorDetails = isError(error);
    if (errorDetails) {
      throw new ProviderError(errorDetails.message, errorDetails.code);
    }
    throw new ProviderError("An unknown error occurred", "UNKNOWN_ERROR");
  }
}
