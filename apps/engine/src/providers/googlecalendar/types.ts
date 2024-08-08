import type { calendar_v3 } from "googleapis";

export interface GetEventsRequest
  extends calendar_v3.Params$Resource$Events$List {}
export type GetEventsResponse = calendar_v3.Schema$Events;

export interface CreateEventRequest
  extends calendar_v3.Params$Resource$Events$Insert {}
export interface UpdateEventRequest
  extends calendar_v3.Params$Resource$Events$Update {}
export interface DeleteEventRequest
  extends calendar_v3.Params$Resource$Events$Delete {}

export interface GetCalendarsRequest
  extends calendar_v3.Params$Resource$Calendarlist$List {}
export type GetCalendarsResponse = calendar_v3.Schema$CalendarList;

export interface WatchCalendarRequest
  extends calendar_v3.Params$Resource$Events$Watch {}
export type WatchCalendarResponse = calendar_v3.Schema$Channel;

// Add these new types
export type AclRequest = calendar_v3.Params$Resource$Acl$Get;
export type AclResponse = calendar_v3.Schema$AclRule;

export type CalendarListRequest = calendar_v3.Params$Resource$Calendarlist$Get;
export type CalendarListResponse = calendar_v3.Schema$CalendarListEntry;

export type CalendarRequest = calendar_v3.Params$Resource$Calendars$Get;
export type CalendarResponse = calendar_v3.Schema$Calendar;

export type ChannelRequest = calendar_v3.Params$Resource$Channels$Stop;
export type ChannelResponse = calendar_v3.Schema$Channel;

export type ColorsResponse = calendar_v3.Schema$Colors;

export type EventRequest = calendar_v3.Params$Resource$Events$Get;
export type EventResponse = calendar_v3.Schema$Event;

export type FreeBusyRequest = calendar_v3.Params$Resource$Freebusy$Query;
export type FreeBusyResponse = calendar_v3.Schema$FreeBusyResponse;

export type SettingRequest = calendar_v3.Params$Resource$Settings$Get;
export type SettingResponse = calendar_v3.Schema$Setting;
