"use client";

import { startOfWeek } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import ContextPanel from "@/components/calendar/calendar-context-panel";
import CalendarGrid from "@/components/calendar/calendar-grid";
import CalendarMenu from "@/components/calendar/calendar-menu";
import CalendarToolbar from "@/components/calendar/calendar-toolbar";
import { useCalendars, useMultiCalendarEvents } from "@/hooks/use-calendar";
import type { ExtendedEvent } from "@/types/calendar";

export default function CalendarPage() {
  // UI State - just React useState
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
  const [visibleCalendars, setVisibleCalendars] = useState<Set<string>>(new Set());

  // Server state - TanStack Query
  const { data: calendarsData } = useCalendars();
  const calendars = calendarsData?.calendars ?? [];

  // Initialize visible calendars when loaded
  useEffect(() => {
    if (calendars.length > 0 && visibleCalendars.size === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time initialization from server data
      setVisibleCalendars(new Set(calendars.map((c) => c.id).filter(Boolean) as string[]));
    }
  }, [calendars, visibleCalendars.size]);

  // Time range for events query
  const timeMin = useMemo(() => currentWeekStartDate.toISOString(), [currentWeekStartDate]);
  const timeMax = useMemo(
    () => new Date(currentWeekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    [currentWeekStartDate],
  );

  const visibleCalendarIds = useMemo(
    () => Array.from(visibleCalendars).filter((id) => calendars.some((cal) => cal.id === id)),
    [visibleCalendars, calendars],
  );

  const { data: events = [] } = useMultiCalendarEvents(visibleCalendarIds, timeMin, timeMax);

  const visibleEvents = events.filter((event) =>
    visibleCalendars.has(event.organizer?.email ?? ""),
  );

  const toggleCalendarVisibility = (calendarId: string) => {
    setVisibleCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <CalendarMenu
        className="flex-none w-64"
        calendars={calendars}
        visibleCalendars={visibleCalendars}
        toggleCalendarVisibility={toggleCalendarVisibility}
        currentWeekStartDate={currentWeekStartDate}
        setCurrentWeekStartDate={setCurrentWeekStartDate}
      />
      <main className="flex flex-col grow overflow-hidden">
        <CalendarToolbar
          currentWeekStartDate={currentWeekStartDate}
          setCurrentWeekStartDate={setCurrentWeekStartDate}
        />
        <CalendarGrid
          className="grow overflow-hidden"
          calendars={calendars}
          events={visibleEvents}
          currentWeekStartDate={currentWeekStartDate}
          visibleCalendars={visibleCalendars}
          setSelectedEvent={setSelectedEvent}
        />
      </main>
      <ContextPanel
        className="flex-none w-64"
        selectedEvent={selectedEvent}
        events={events}
        visibleCalendars={visibleCalendars}
        calendars={calendars}
      />
    </div>
  );
}
