"use client";

import { useQuery } from "@tanstack/react-query";
import type { calendar_v3 } from "googleapis";
import {
  api,
  queryKeys,
  useSimpleMutation,
  type CalendarsResponse,
  type ColorsResponse,
  type EventsResponse,
  type SyncResponse,
} from "@/lib/api";

// Types
type CalendarEvent = calendar_v3.Schema$Event;

interface GoogleStatusResponse {
  connected: boolean;
}

// Queries
export function useGoogleStatus() {
  return useQuery<GoogleStatusResponse>({
    queryKey: queryKeys.google.status,
    queryFn: () => api.google.status(),
  });
}

export function useCalendars() {
  return useQuery<CalendarsResponse>({
    queryKey: queryKeys.calendars.all,
    queryFn: () => api.calendar.listCalendars(),
  });
}

export function useEvents(
  calendarId: string,
  timeMin: string,
  timeMax: string,
) {
  return useQuery<EventsResponse>({
    queryKey: queryKeys.events.byCalendar(calendarId, timeMin, timeMax),
    queryFn: () => api.calendar.events.list(calendarId, timeMin, timeMax),
    enabled: !!calendarId && !!timeMin && !!timeMax,
  });
}

export function useMultiCalendarEvents(
  calendarIds: string[],
  timeMin: string,
  timeMax: string,
) {
  return useQuery<CalendarEvent[]>({
    queryKey: queryKeys.events.multi(calendarIds, timeMin, timeMax),
    queryFn: async () => {
      const results = await Promise.all(
        calendarIds.map((calendarId) =>
          api.calendar.events.list(calendarId, timeMin, timeMax),
        ),
      );
      return results.flatMap((r) => r.events);
    },
    enabled: calendarIds.length > 0 && !!timeMin && !!timeMax,
  });
}

export function useColors() {
  return useQuery<ColorsResponse>({
    queryKey: queryKeys.calendars.colors,
    queryFn: () => api.calendar.getColors(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Mutations
export function useCreateEvent() {
  return useSimpleMutation<
    { event: CalendarEvent },
    { calendarId: string; event: CalendarEvent }
  >({
    mutationFn: ({ calendarId, event }) =>
      api.calendar.events.create(calendarId, event),
    invalidateKeys: [queryKeys.events.all],
  });
}

export function useUpdateEvent() {
  return useSimpleMutation<
    { event: CalendarEvent },
    { calendarId: string; eventId: string; event: Partial<CalendarEvent> }
  >({
    mutationFn: ({ calendarId, eventId, event }) =>
      api.calendar.events.update(eventId, calendarId, event),
    invalidateKeys: [queryKeys.events.all],
  });
}

export function useDeleteEvent() {
  return useSimpleMutation<
    { success: boolean },
    { calendarId: string; eventId: string }
  >({
    mutationFn: ({ calendarId, eventId }) =>
      api.calendar.events.delete(eventId, calendarId),
    invalidateKeys: [queryKeys.events.all],
  });
}

export function useSyncCalendars() {
  return useSimpleMutation<SyncResponse, void>({
    mutationFn: () => api.calendar.sync(),
    invalidateKeys: [queryKeys.events.all, queryKeys.calendars.all],
  });
}
