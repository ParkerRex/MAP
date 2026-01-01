"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { calendar_v3 } from "googleapis";
import { useCallback, useState } from "react";
import {
  api,
  type CalendarsResponse,
  type ColorsResponse,
  type EventsResponse,
  queryKeys,
  type SyncResponse,
  useSimpleMutation,
} from "@/lib/api";

// Types
type CalendarEvent = calendar_v3.Schema$Event;

interface GoogleStatusResponse {
  connected: boolean;
}

// Error codes that indicate calendar access was revoked
const CALENDAR_ACCESS_REVOKED_CODES = ["INVALID_GRANT", "TOKEN_EXPIRED", "ACCESS_REVOKED"];

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

export function useEvents(calendarId: string, timeMin: string, timeMax: string) {
  return useQuery<EventsResponse>({
    queryKey: queryKeys.events.byCalendar(calendarId, timeMin, timeMax),
    queryFn: () => api.calendar.events.list(calendarId, timeMin, timeMax),
    enabled: !!calendarId && !!timeMin && !!timeMax,
  });
}

export function useMultiCalendarEvents(calendarIds: string[], timeMin: string, timeMax: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: queryKeys.events.multi(calendarIds, timeMin, timeMax),
    queryFn: async () => {
      const results = await Promise.all(
        calendarIds.map((calendarId) => api.calendar.events.list(calendarId, timeMin, timeMax)),
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
  return useSimpleMutation<{ event: CalendarEvent }, { calendarId: string; event: CalendarEvent }>({
    mutationFn: ({ calendarId, event }) => api.calendar.events.create(calendarId, event),
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
  return useSimpleMutation<{ success: boolean }, { calendarId: string; eventId: string }>({
    mutationFn: ({ calendarId, eventId }) => api.calendar.events.delete(eventId, calendarId),
    invalidateKeys: [queryKeys.events.all],
  });
}

export function useSyncCalendars() {
  return useSimpleMutation<SyncResponse, void>({
    mutationFn: () => api.calendar.sync(),
    invalidateKeys: [queryKeys.events.all, queryKeys.calendars.all],
  });
}

// Helper to check if an error indicates calendar access was revoked
export function isCalendarAccessRevokedError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode =
    (error as { code?: string })?.code ?? (error as { error?: { code?: string } })?.error?.code;

  return (
    CALENDAR_ACCESS_REVOKED_CODES.some(
      (code) => errorMessage.includes(code) || errorCode?.includes(code) === true,
    ) ||
    errorMessage.includes("invalid_grant") ||
    errorMessage.includes("Token has been expired or revoked")
  );
}

// Hook to manage calendar reconnection state
export function useCalendarReconnect() {
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const queryClient = useQueryClient();

  const checkForReconnect = useCallback((error: unknown) => {
    if (isCalendarAccessRevokedError(error)) {
      setNeedsReconnect(true);
      return true;
    }
    return false;
  }, []);

  const reconnect = useCallback(() => {
    // Redirect to Google OAuth to re-authenticate calendar access
    window.location.href = "/api/auth/google";
  }, []);

  const dismissReconnect = useCallback(() => {
    setNeedsReconnect(false);
  }, []);

  const onReconnectSuccess = useCallback(() => {
    setNeedsReconnect(false);
    // Refresh all calendar-related queries
    queryClient.invalidateQueries({ queryKey: queryKeys.google.status });
    queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
  }, [queryClient]);

  return {
    needsReconnect,
    checkForReconnect,
    reconnect,
    dismissReconnect,
    onReconnectSuccess,
  };
}
