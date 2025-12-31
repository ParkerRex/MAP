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
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      <div className="flex min-w-[640px] sticky top-0 z-10 border-b border-border bg-background">
        <div className="w-12 shrink-0 sm:w-16" />
        {daysOfWeek.map((day) => (
          <div key={day.toISOString()} className="min-w-[80px] flex-1 p-2 text-center">
            <div className="text-sm text-muted-foreground">{format(day, "EEE")}</div>
            <div
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
                isSameDay(day, new Date())
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
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
      <div className="flex flex-1 overflow-auto" ref={gridRef}>
        <div className="min-w-[640px] flex flex-1">
          <div className="w-12 shrink-0 sm:w-16">
            {hours.map((hour) => (
              <div key={hour} className="h-16 pr-2 text-right text-xs text-muted-foreground">
                {format(new Date().setHours(hour, 0, 0, 0), "h a")}
              </div>
            ))}
          </div>
          <div className="relative grid flex-1 grid-cols-7">
            {daysOfWeek.map((day, dayIndex) => (
              <div key={day.toISOString()} className="relative min-w-[80px]">
                {hours.map((hour) => (
                  <div key={hour} className="h-16 border-t border-border" />
                ))}
                <CalendarEventComponent
                  events={regularEvents.filter((event) => {
                    const eventStart = event.start?.dateTime
                      ? new Date(event.start.dateTime)
                      : null;
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
    </div>
  );
};

export default CalendarGrid;
