import type { calendar_v3 } from "googleapis";

// Extend the Google Calendar API types for our specific needs
export interface ExtendedCalendarListEntry
  extends calendar_v3.Schema$CalendarListEntry {
  nextSyncToken?: string;
}

export type Calendar = ExtendedCalendarListEntry;

export const createCalendarSchema: Partial<calendar_v3.Schema$Calendar> = {
  summary: "",
  description: "",
  timeZone: "",
};

export type CreateCalendarInput = typeof createCalendarSchema;

export interface ExtendedEvent extends calendar_v3.Schema$Event {
  all_day?: boolean;
  calendarId?: string;
}

export interface CalendarEvent extends ExtendedEvent {
  extendedProperties?: {
    private?: { [key: string]: string };
    shared?: { [key: string]: string };
  } | null;
}

export const createEventSchema: Partial<calendar_v3.Schema$Event> = {
  summary: "",
  description: "",
  start: {
    dateTime: "",
    timeZone: "",
  },
  end: {
    dateTime: "",
    timeZone: "",
  },
  recurrence: [],
  attendees: [],
  reminders: {
    useDefault: true,
  },
};

export type CreateEventInput = typeof createEventSchema;

export interface CalendarContextType {
  currentWeekStartDate: Date;
  setCurrentWeekStartDate: (date: Date) => void;
  selectedCalendar: string | null;
  setSelectedCalendar: React.Dispatch<React.SetStateAction<string | null>>;
  events: calendar_v3.Schema$Event[];
  selectedEvent: calendar_v3.Schema$Event | null;
  setSelectedEvent: React.Dispatch<
    React.SetStateAction<calendar_v3.Schema$Event | null>
  >;
  createEvent: (event: Partial<calendar_v3.Schema$Event>) => void;
  updateEvent: (event: calendar_v3.Schema$Event) => void;
  deleteEvent: (event: calendar_v3.Schema$Event) => void;
  visibleCalendars: Set<string>;
  toggleCalendarVisibility: (calendarId: string) => void;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  userTimeZone: string;
}

export interface SyncResult {
  calendars_synced: number;
  events_synced: number;
  [key: string]: unknown;
}
