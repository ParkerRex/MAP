"use client";

import type { ExtendedEvent } from "@/types/calendar";
import { startOfWeek } from "date-fns";
import { create } from "zustand";

interface CalendarUIState {
  // UI State
  selectedEvent: ExtendedEvent | null;
  visibleCalendars: Set<string>;
  selectedCalendar: string | null;
  currentWeekStartDate: Date;
  userTimeZone: string;
  isInitialized: boolean;

  // Actions
  setSelectedEvent: (event: ExtendedEvent | null) => void;
  toggleCalendarVisibility: (calendarId: string) => void;
  setVisibleCalendars: (calendarIds: string[]) => void;
  setSelectedCalendar: (calendarId: string | null) => void;
  setCurrentWeekStartDate: (date: Date) => void;
  initializeVisibleCalendars: (calendarIds: string[]) => void;
}

export const useCalendarStore = create<CalendarUIState>((set, get) => ({
  // Initial state
  selectedEvent: null,
  visibleCalendars: new Set<string>(),
  selectedCalendar: null,
  currentWeekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
  userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  isInitialized: false,

  // Actions
  setSelectedEvent: (event) => set({ selectedEvent: event }),

  toggleCalendarVisibility: (calendarId) =>
    set((state) => {
      const next = new Set(state.visibleCalendars);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return { visibleCalendars: next };
    }),

  setVisibleCalendars: (calendarIds) =>
    set({ visibleCalendars: new Set(calendarIds) }),

  setSelectedCalendar: (calendarId) => set({ selectedCalendar: calendarId }),

  setCurrentWeekStartDate: (date) => set({ currentWeekStartDate: date }),

  // Initialize visible calendars only once when calendars are first loaded
  initializeVisibleCalendars: (calendarIds) => {
    if (!get().isInitialized && calendarIds.length > 0) {
      set({
        visibleCalendars: new Set(calendarIds),
        isInitialized: true,
      });
    }
  },
}));
