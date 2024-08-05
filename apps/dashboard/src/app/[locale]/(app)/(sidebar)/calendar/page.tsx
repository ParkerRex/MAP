"use client";

import CalendarGrid from "@/components/calendar/calendar-grid";
import CalendarToolbar from "@/components/calendar/calendar-toolbar";
import { useCalendar } from "@/store/calendar-context";

export default function CalendarPage() {
  const { events, calendars, visibleCalendars } = useCalendar();

  const visibleEvents = events.filter((event) =>
    visibleCalendars.has(event.organizer?.email ?? ""),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CalendarToolbar calendars={calendars} />
      <CalendarGrid
        className="flex-grow overflow-hidden"
        calendars={calendars}
        events={visibleEvents}
      />
    </div>
  );
}
