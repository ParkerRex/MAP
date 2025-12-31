"use client";

import {
  useCalendars,
  useMultiCalendarEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useSyncCalendars,
} from "@/hooks/use-calendar";
import type { ExtendedCalendarListEntry, ExtendedEvent } from "@/types/calendar";
import type { CalendarContextType } from "@/types/calendar";
import type { calendar_v3 } from "googleapis";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({
  children,
  userId,
}) => {
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<Date>(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
  const [visibleCalendars, setVisibleCalendars] = useState<Set<string>>(new Set());
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const [userTimeZone] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Calculate time range
  const timeMin = useMemo(() => currentWeekStartDate.toISOString(), [currentWeekStartDate]);
  const timeMax = useMemo(
    () => new Date(currentWeekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    [currentWeekStartDate]
  );

  // TanStack Query hooks
  const { data: calendarsData } = useCalendars();
  const calendars = (calendarsData?.calendars ?? []) as ExtendedCalendarListEntry[];

  // Get visible calendar IDs for fetching events
  const visibleCalendarIds = useMemo(() => {
    return Array.from(visibleCalendars).filter((id) => calendars.some((cal) => cal.id === id));
  }, [visibleCalendars, calendars]);

  const { data: events = [] } = useMultiCalendarEvents(visibleCalendarIds, timeMin, timeMax);

  // Mutations
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const syncMutation = useSyncCalendars();

  // Set all calendars as visible by default when calendars are loaded
  useEffect(() => {
    if (calendars.length > 0 && visibleCalendars.size === 0) {
      setVisibleCalendars(new Set(calendars.map((cal) => cal.id).filter(Boolean) as string[]));
    }
  }, [calendars, visibleCalendars.size]);

  const createEvent = useCallback(
    async (calendarId: string, eventData: calendar_v3.Schema$Event) => {
      const result = await createEventMutation.mutateAsync({ calendarId, event: eventData });
      return result.event;
    },
    [createEventMutation]
  );

  const updateEventHandler = useCallback(
    async (calendarId: string, eventId: string, eventData: Partial<calendar_v3.Schema$Event>) => {
      const result = await updateEventMutation.mutateAsync({ calendarId, eventId, event: eventData });
      return result.event;
    },
    [updateEventMutation]
  );

  const deleteEventHandler = useCallback(
    async (calendarId: string, eventId: string) => {
      await deleteEventMutation.mutateAsync({ calendarId, eventId });
    },
    [deleteEventMutation]
  );

  const syncEvents = useCallback(async () => {
    const result = await syncMutation.mutateAsync();
    return result;
  }, [syncMutation]);

  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    setVisibleCalendars((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(calendarId)) {
        newSet.delete(calendarId);
      } else {
        newSet.add(calendarId);
      }
      return newSet;
    });
  }, []);

  const contextValue: CalendarContextType = {
    events,
    calendars,
    selectedEvent,
    setSelectedEvent,
    visibleCalendars,
    toggleCalendarVisibility,
    selectedCalendar,
    setSelectedCalendar,
    currentWeekStartDate,
    setCurrentWeekStartDate,
    createEvent,
    updateEvent: updateEventHandler,
    deleteEvent: deleteEventHandler,
    userTimeZone,
    syncEvents,
  };

  return <CalendarContext.Provider value={contextValue}>{children}</CalendarContext.Provider>;
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};
