import { useCalendar } from "@/store/calendar-context";
import CalendarGrid from "./calendar-grid";
import CalendarToolbar from "./calendar-toolbar";

export default function CalendarContent() {
  const { events, calendars, visibleCalendars } = useCalendar();

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
