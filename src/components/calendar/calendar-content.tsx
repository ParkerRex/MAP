"use client";
import { useCalendars, useMultiCalendarEvents } from "@/hooks/use-calendar";
import { useCalendarStore } from "@/store/calendar";
import { useMemo, useEffect } from "react";
import CalendarGrid from "./calendar-grid";
import CalendarToolbar from "./calendar-toolbar";

export default function CalendarContent() {
  const visibleCalendars = useCalendarStore((s) => s.visibleCalendars);
  const currentWeekStartDate = useCalendarStore((s) => s.currentWeekStartDate);
  const initializeVisibleCalendars = useCalendarStore((s) => s.initializeVisibleCalendars);

  const { data: calendarsData } = useCalendars();
  const calendars = calendarsData?.calendars ?? [];

  // Initialize visible calendars when calendars are loaded
  useEffect(() => {
    const calendarIds = calendars.map((cal) => cal.id).filter(Boolean) as string[];
    initializeVisibleCalendars(calendarIds);
  }, [calendars, initializeVisibleCalendars]);

  // Calculate time range for events query
  const timeMin = useMemo(() => currentWeekStartDate.toISOString(), [currentWeekStartDate]);
  const timeMax = useMemo(
    () => new Date(currentWeekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    [currentWeekStartDate]
  );

  const visibleCalendarIds = useMemo(
    () => Array.from(visibleCalendars).filter((id) => calendars.some((cal) => cal.id === id)),
    [visibleCalendars, calendars]
  );

  const { data: events = [] } = useMultiCalendarEvents(visibleCalendarIds, timeMin, timeMax);

  const visibleEvents = events.filter((event) =>
    visibleCalendars.has(event.organizer?.email ?? ""),
  );

  return (
    <div className="flex flex-col h-full">
      <CalendarToolbar calendars={calendars} />
      <CalendarGrid className="flex-grow" calendars={calendars} events={visibleEvents} />
    </div>
  );
}
