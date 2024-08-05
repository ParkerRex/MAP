"use client";
import type {
  ExtendedCalendarListEntry,
  ExtendedEvent,
} from "@/types/calendar";
import type { CalendarContextType } from "@/types/calendar";
import { safeParseDate } from "@/utils/date-utils";
import { createClient } from "@map/supabase/client";

import { createContext, useContext, useEffect, useState } from "react";

export const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined,
);

export const CalendarProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
}> = ({ children, userId }) => {
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

  useEffect(() => {
    const fetchUserTimezone = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("timezone")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user timezone:", error);
      } else {
        setUserTimeZone(data.timezone || "UTC");
      }
    };

    fetchUserTimezone();
  }, [userId]);

  useEffect(() => {
    // TODO: Implement server action: fetchCalendars in dashboard/actions/calendar/fetch-calendars.ts
    // Fetch calendars and update state
  }, [userId]);

  useEffect(() => {
    // TODO: Implement server action: fetchCalendarEvents in dashboard/actions/calendar/fetch-calendar-events.ts
    // Fetch events and update state
  }, [userId, currentWeekStartDate, userTimeZone]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("calendar_events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_events",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Real-time update received:", payload);
          // TODO: Implement server action: refetchEvents in dashboard/actions/calendar/refetch-events.ts
          // Refetch events and update state
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const createEvent = async (newEvent: Partial<ExtendedEvent>) => {
    // TODO: Implement server action: createCalendarEvent in dashboard/actions/calendar/create-calendar-event.ts
    // Create event and update state
  };

  const updateEvent = async (updatedEvent: Partial<ExtendedEvent>) => {
    // TODO: Implement server action: updateCalendarEvent in dashboard/actions/calendar/update-calendar-event.ts
    // Update event and update state
  };

  const deleteEvent = async (event: ExtendedEvent) => {
    // TODO: Implement server action: deleteCalendarEvent in dashboard/actions/calendar/delete-calendar-event.ts
    // Delete event and update state
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
    userId,
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
