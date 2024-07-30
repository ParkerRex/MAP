// /app/calendar/page.tsx
'use client';

import CalendarGrid from './components/CalendarGrid';
import CalendarToolbar from './components/CalendarToolbar';
import { useCalendar } from './contexts/CalendarContext';

export default function CalendarPage() {
  const { events, calendars, visibleCalendars } = useCalendar();

  const visibleEvents = events.filter((event) =>
    visibleCalendars.has(event.organizer?.email ?? ''),
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
