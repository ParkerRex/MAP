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

  // Calendar List methods
  async getCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$List,
  ): Promise<calendar_v3.Schema$CalendarList> {
    try {
      const response = await this.calendar.calendarList.list(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Event methods
  async getEvents(
    params: calendar_v3.Params$Resource$Events$List,
  ): Promise<calendar_v3.Schema$Events> {
    try {
      const response = await this.calendar.events.list(params);
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

  // Calendar methods
  async deleteCalendar(
    params: calendar_v3.Params$Resource$Calendars$Delete,
  ): Promise<void> {
    try {
      await this.calendar.calendars.delete(params);
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

  // Calendar Resources methods
  async getCalendarResources(
    params: calendar_v3.Params$Resource$Freebusy$Query,
  ): Promise<calendar_v3.Schema$FreeBusyResponse> {
    try {
      const response = await this.calendar.freebusy.query(params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Colors methods
  async getColors(): Promise<calendar_v3.Schema$Colors> {
    try {
      const response = await this.calendar.colors.get();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Webhook methods
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

  private handleError(error: unknown): ProviderError {
    if (isError(error)) {
      return new ProviderError(error.message, {
        cause: error,
        provider: "google",
      });
    }
    return new ProviderError("An unknown error occurred", {
      provider: "google",
    });
  }
}
