"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { calendar_v3 } from "googleapis";

// Types
type CalendarEvent = calendar_v3.Schema$Event;
type CalendarListEntry = calendar_v3.Schema$CalendarListEntry;

interface EventsResponse {
  events: CalendarEvent[];
}

interface CalendarsResponse {
  calendars: CalendarListEntry[];
}

interface ColorsResponse {
  colors: calendar_v3.Schema$Colors;
}

interface SyncResponse {
  success: boolean;
  calendarsSynced?: number;
  eventsSynced?: number;
  error?: string;
}

// Queries
export function useCalendars() {
  return useQuery<CalendarsResponse>({
    queryKey: ["calendars"],
    queryFn: async () => {
      const response = await fetch("/api/calendar/calendars");
      if (!response.ok) {
        throw new Error("Failed to fetch calendars");
      }
      return response.json();
    },
  });
}

export function useEvents(calendarId: string, timeMin: string, timeMax: string) {
  return useQuery<EventsResponse>({
    queryKey: ["events", calendarId, timeMin, timeMax],
    queryFn: async () => {
      const params = new URLSearchParams({
        calendarId,
        timeMin,
        timeMax,
      });
      const response = await fetch(`/api/calendar/events?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
    enabled: !!calendarId && !!timeMin && !!timeMax,
  });
}

export function useMultiCalendarEvents(
  calendarIds: string[],
  timeMin: string,
  timeMax: string
) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["events", "multi", calendarIds.sort().join(","), timeMin, timeMax],
    queryFn: async () => {
      const allEvents: CalendarEvent[] = [];

      await Promise.all(
        calendarIds.map(async (calendarId) => {
          const params = new URLSearchParams({
            calendarId,
            timeMin,
            timeMax,
          });
          const response = await fetch(`/api/calendar/events?${params}`);
          if (response.ok) {
            const data: EventsResponse = await response.json();
            allEvents.push(...data.events);
          }
        })
      );

      return allEvents;
    },
    enabled: calendarIds.length > 0 && !!timeMin && !!timeMax,
  });
}

export function useColors() {
  return useQuery<ColorsResponse>({
    queryKey: ["calendar-colors"],
    queryFn: async () => {
      const response = await fetch("/api/calendar/colors");
      if (!response.ok) {
        throw new Error("Failed to fetch colors");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Mutations
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<{ event: CalendarEvent }, Error, { calendarId: string; event: CalendarEvent }>({
    mutationFn: async ({ calendarId, event }) => {
      const response = await fetch(`/api/calendar/events?calendarId=${calendarId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        throw new Error("Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation<
    { event: CalendarEvent },
    Error,
    { calendarId: string; eventId: string; event: Partial<CalendarEvent> }
  >({
    mutationFn: async ({ calendarId, eventId, event }) => {
      const response = await fetch(
        `/api/calendar/events/${eventId}?calendarId=${calendarId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { calendarId: string; eventId: string }>({
    mutationFn: async ({ calendarId, eventId }) => {
      const response = await fetch(
        `/api/calendar/events/${eventId}?calendarId=${calendarId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useSyncCalendars() {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, Error>({
    mutationFn: async () => {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to sync calendars");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
}
