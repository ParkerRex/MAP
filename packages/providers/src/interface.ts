import type { calendar_v3 } from "googleapis";

export interface Provider {
  getCalendarList(
    params?: calendar_v3.Params$Resource$Calendarlist$List,
  ): Promise<calendar_v3.Schema$CalendarList>;

  getEvents(
    params: calendar_v3.Params$Resource$Events$List,
  ): Promise<calendar_v3.Schema$Events>;

  updateEvent(
    params: calendar_v3.Params$Resource$Events$Update,
  ): Promise<calendar_v3.Schema$Event>;

  deleteEvent(params: calendar_v3.Params$Resource$Events$Delete): Promise<void>;

  deleteCalendar(
    params: calendar_v3.Params$Resource$Calendars$Delete,
  ): Promise<void>;

  updateCalendar(
    params: calendar_v3.Params$Resource$Calendars$Update,
  ): Promise<calendar_v3.Schema$Calendar>;

  getCalendarResources(
    params: calendar_v3.Params$Resource$Freebusy$Query,
  ): Promise<calendar_v3.Schema$FreeBusyResponse>;

  getColors(): Promise<calendar_v3.Schema$Colors>;

  watchEvents(
    params: calendar_v3.Params$Resource$Events$Watch,
  ): Promise<calendar_v3.Schema$Channel>;

  stopChannel(params: calendar_v3.Params$Resource$Channels$Stop): Promise<void>;
}
