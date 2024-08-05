"use client";
import type {
  ExtendedCalendarListEntry,
  ExtendedEvent,
} from "@/types/calendar";
import type { CalendarContextType } from "@/types/calendar";
import { createClient } from "@map/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  fetchCalendars,
  updateCalendarEvent,
} from "../../../actions/calendar/calendarActions";
import { formatForDatabase, safeParseDate } from "../utils/dateUtils";

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

  const queryClient = useQueryClient();

  const { data: calendars = [] } = useQuery<
    ExtendedCalendarListEntry[],
    Error,
    ExtendedCalendarListEntry[]
  >({
    queryKey: ["calendars", userId],
    queryFn: () => fetchCalendars(userId),
  });

  const { data: events = [], refetch: refetchEvents } = useQuery<
    ExtendedEvent[],
    Error
  >({
    queryKey: ["events", userId, currentWeekStartDate],
    queryFn: async () => {
      const startDate = safeParseDate(currentWeekStartDate)
        ?.startOf("week")
        .minus({ weeks: 1 });
      const endDate = safeParseDate(currentWeekStartDate)
        ?.endOf("week")
        .plus({ weeks: 1 });
      console.log("Fetching events for date range:", startDate, endDate);
      const fetchedEvents = await fetchCalendarEvents(
        userId,
        startDate?.toJSDate() || new Date(),
        endDate?.toJSDate() || new Date(),
        userTimeZone,
      );
      console.log("Fetched events:", fetchedEvents);
      return fetchedEvents;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

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
          refetchEvents();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetchEvents]);

  const createEvent = useMutation({
    mutationFn: (newEvent: Partial<ExtendedEvent>) =>
      createCalendarEvent(userId, newEvent as unknown as FormData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events", userId, currentWeekStartDate],
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: (updatedEvent: Partial<ExtendedEvent>) =>
      updateCalendarEvent(
        userId,
        updatedEvent.id as string,
        updatedEvent as unknown as FormData,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events", userId, currentWeekStartDate],
      });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (event: ExtendedEvent) =>
      deleteCalendarEvent(
        userId,
        event.id as string,
        event.calendarId as string,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events", userId, currentWeekStartDate],
      });
    },
  });

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
    createEvent: (event: Partial<ExtendedEvent>) => createEvent.mutate(event),
    updateEvent: updateEvent.mutate,
    deleteEvent: (event: ExtendedEvent) => deleteEvent.mutate(event),
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
