import type { calendar_v3 } from "googleapis";

export interface ProviderParams {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  kv?: KVNamespace;
}

export interface GetEventsRequest {
  calendarId: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

export type GetEventsResponse = calendar_v3.Schema$Events;

export interface CreateEventRequest {
  calendarId: string;
  event: calendar_v3.Schema$Event;
}

export interface UpdateEventRequest {
  calendarId: string;
  eventId: string;
  event: calendar_v3.Schema$Event;
}

export interface DeleteEventRequest {
  calendarId: string;
  eventId: string;
}

export type GetCalendarsResponse = calendar_v3.Schema$CalendarList;

export interface CreateCalendarRequest {
  summary: string;
  description?: string;
}

export interface DeleteCalendarRequest {
  calendarId: string;
}
