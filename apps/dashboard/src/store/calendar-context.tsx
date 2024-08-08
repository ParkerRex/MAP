"use client";
import type {
  ExtendedCalendarListEntry,
  ExtendedEvent,
} from "@/types/calendar";
import type { CalendarContextType } from "@/types/calendar";

import { createContext, useContext, useEffect, useState } from "react";

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
  const [events, setEvents] = useState<ExtendedEvent[]>([]);

  const createEvent = async (newEvent: Partial<ExtendedEvent>) => {
    // TODO: Implement server action: createCalendarEvent
  };

  const updateEvent = async (updatedEvent: Partial<ExtendedEvent>) => {
    // TODO: Implement server action: updateCalendarEvent
  };

  const deleteEvent = async (event: ExtendedEvent) => {
    // TODO: Implement server action: deleteCalendarEvent
  };

  const contextValue: CalendarContextType = {
    calendars,
    events,
    selectedEvent,
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
    createEvent,
    updateEvent,
    deleteEvent,
    userTimeZone,
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
