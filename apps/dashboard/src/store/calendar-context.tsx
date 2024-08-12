"use client";
// TODO: SWAP THESE OUT FOR SEPARATE SERVER ACTIONS THAT ARE SAFE

import {
  addEvent,
  deleteEvent,
  updateEvent,
} from "@/actions/calendar/calendarActions";
import type {
  ExtendedCalendarListEntry,
  ExtendedEvent,
} from "@/types/calendar";
import type { CalendarContextType } from "@/types/calendar";
import type { calendar_v3 } from "googleapis";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined,
);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<Date>(
    () => new Date(),
  );
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(
    null,
  );
  const [visibleCalendars, setVisibleCalendars] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const [userTimeZone, setUserTimeZone] = useState<string>("UTC");
  const [calendars, setCalendars] = useState<ExtendedCalendarListEntry[]>([]);
  const [events, setEvents] = useState<calendar_v3.Schema$Event[]>([]);
  const [calendar, setCalendar] = useState<calendar_v3.Schema$Calendar | null>(
    null,
  );

  const syncEvents = useCallback((events: ExtendedEvent[]) => {
    setEvents((prevEvents) => {
      const eventMap = new Map(prevEvents.map((event) => [event.id, event]));

      for (const event of events) {
        if (event.status === "cancelled") {
          eventMap.delete(event.id);
        } else {
          eventMap.set(event.id, event);
        }
      }

      return Array.from(eventMap.values());
    });
  }, []);

  const contextValue: CalendarContextType = {
    events,
    calendars,
    selectedEvent,
    setEvents,
    setCalendars: (newCalendars: ExtendedCalendarListEntry[]) => {
      setCalendars(newCalendars);
    },
    setSelectedEvent,
    visibleCalendars,
    toggleCalendarVisibility: (calendarId: string) =>
      setVisibleCalendars((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(calendarId)) {
          newSet.delete(calendarId);
        } else {
          newSet.add(calendarId);
        }
        return newSet;
      }),
    selectedCalendar,
    setSelectedCalendar,
    currentWeekStartDate,
    setCurrentWeekStartDate,
    createEvent: addEvent,
    updateEvent,
    deleteEvent,
    userTimeZone,
    syncEvents,
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};
