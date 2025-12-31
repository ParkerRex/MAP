"use client";
import { addDays, eachDayOfInterval, format, isSameDay, startOfWeek } from "date-fns";
import type { calendar_v3 } from "googleapis";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import type { CalendarEvent, ExtendedEvent } from "@/types/calendar";
import CalendarAllDayEvents from "./all-day-events";
import CalendarEventComponent from "./calendar-event";

interface CalendarGridProps {
  className?: string;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  events: calendar_v3.Schema$Event[];
  currentWeekStartDate: Date;
  visibleCalendars: Set<string>;
  setSelectedEvent: (event: ExtendedEvent | null) => void;
}

const CalendarGrid: FC<CalendarGridProps> = ({
  className,
  calendars,
  events,
  currentWeekStartDate,
  visibleCalendars,
  setSelectedEvent,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const startOfWeekDate = startOfWeek(currentWeekStartDate, {
    weekStartsOn: 1,
  });
  const endOfWeekDate = addDays(startOfWeekDate, 6);
  const daysOfWeek = eachDayOfInterval({
    start: startOfWeekDate,
    end: endOfWeekDate,
  });

  const isAllDayEvent = (event: CalendarEvent) => {
    return event.start?.date !== undefined;
  };

  const filteredEvents = events.filter(
    (event) => event.organizer?.email && visibleCalendars.has(event.organizer.email),
  );

  const allDayEvents = filteredEvents.filter(isAllDayEvent);
  const regularEvents = filteredEvents.filter((event) => !isAllDayEvent(event));

  useEffect(() => {
    if (gridRef.current) {
      const gridHeight = gridRef.current.scrollHeight;
      const viewportHeight = gridRef.current.clientHeight;
      const hourHeight = gridHeight / 24;
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const scrollPosition = currentHour * hourHeight - viewportHeight / 2;
      gridRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <div className="flex sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="w-16 shrink-0" />
        {daysOfWeek.map((day) => (
          <div key={day.toISOString()} className="flex-1 text-center p-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">{format(day, "EEE")}</div>
            <div
              className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full ${
                isSameDay(day, new Date())
                  ? "bg-[#48CA80] text-white"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      <CalendarAllDayEvents
        events={allDayEvents}
        daysOfWeek={daysOfWeek}
        calendars={calendars}
        setSelectedEvent={setSelectedEvent}
      />
      <div className="flex grow overflow-y-auto" ref={gridRef}>
        <div className="w-16 shrink-0">
          {hours.map((hour) => (
            <div key={hour} className="h-16 text-xs text-gray-500 text-right pr-2">
              {format(new Date().setHours(hour, 0, 0, 0), "h a")}
            </div>
          ))}
        </div>
        <div className="grow grid grid-cols-7 relative">
          {daysOfWeek.map((day, dayIndex) => (
            <div key={day.toISOString()} className="relative">
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-t border-gray-200 dark:border-gray-700" />
              ))}
              <CalendarEventComponent
                events={regularEvents.filter((event) => {
                  const eventStart = event.start?.dateTime ? new Date(event.start.dateTime) : null;
                  return eventStart && isSameDay(eventStart, day);
                })}
                dayIndex={dayIndex}
                calendars={calendars}
                setSelectedEvent={setSelectedEvent}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
