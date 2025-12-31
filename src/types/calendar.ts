import type { calendar_v3 } from "googleapis";

// Extend the Google Calendar API types for our specific needs
export interface ExtendedCalendarListEntry extends calendar_v3.Schema$CalendarListEntry {
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
  events: calendar_v3.Schema$Event[];
  calendars: ExtendedCalendarListEntry[];
  selectedEvent: ExtendedEvent | null;
  setSelectedEvent: (event: ExtendedEvent | null) => void;
  visibleCalendars: Set<string>;
  toggleCalendarVisibility: (calendarId: string) => void;
  selectedCalendar: string | null;
  setSelectedCalendar: (calendarId: string | null) => void;
  currentWeekStartDate: Date;
  setCurrentWeekStartDate: (date: Date) => void;
  createEvent: (calendarId: string, eventData: any) => Promise<calendar_v3.Schema$Event>;
  updateEvent: (
    calendarId: string,
    eventId: string,
    eventData: any,
  ) => Promise<calendar_v3.Schema$Event>;
  deleteEvent: (calendarId: string, eventId: string) => Promise<void>;
  userTimeZone: string;
  syncEvents: () => Promise<{
    success: boolean;
    calendarsSynced?: number;
    eventsSynced?: number;
    error?: string;
    details?: any;
  }>;
}

export interface SyncResult {
  calendars_synced: number;
  events_synced: number;
  [key: string]: unknown;
}
