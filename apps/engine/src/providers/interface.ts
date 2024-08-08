import type { calendar_v3 } from "googleapis";
import type {
  CreateCalendarRequest,
  CreateEventRequest,
  DeleteCalendarRequest,
  DeleteEventRequest,
  GetCalendarsResponse,
  GetEventsRequest,
  GetEventsResponse,
  UpdateEventRequest,
} from "./types";

export interface CalendarProvider {
  getEvents: (params: GetEventsRequest) => Promise<GetEventsResponse>;
  createEvent: (
    params: CreateEventRequest,
  ) => Promise<calendar_v3.Schema$Event>;
  updateEvent: (
    params: UpdateEventRequest,
  ) => Promise<calendar_v3.Schema$Event>;
  deleteEvent: (params: DeleteEventRequest) => Promise<void>;
  getCalendars: () => Promise<GetCalendarsResponse>;
  createCalendar: (
    params: CreateCalendarRequest,
  ) => Promise<calendar_v3.Schema$Calendar>;
  deleteCalendar: (params: DeleteCalendarRequest) => Promise<void>;
}
