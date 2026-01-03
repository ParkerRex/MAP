"use client";
import {
  addDays,
  eachDayOfInterval,
  format,
  isBefore,
  isSameDay,
  isWeekend,
  startOfWeek,
} from "date-fns";
import type { calendar_v3 } from "googleapis";
import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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

const HOUR_HEIGHT = 64;

const CalendarGrid: FC<CalendarGridProps> = ({
  className,
  calendars,
  events,
  currentWeekStartDate,
  visibleCalendars,
  setSelectedEvent,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
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

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate if current time is in view
  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    const weekEnd = addDays(startOfWeekDate, 7);
    return !isBefore(now, startOfWeekDate) && isBefore(now, weekEnd);
  }, [startOfWeekDate]);

  // Get the day index for current time indicator
  const currentDayIndex = useMemo(() => {
    if (!isCurrentWeek) return -1;
    return daysOfWeek.findIndex((day) => isSameDay(day, currentTime));
  }, [isCurrentWeek, daysOfWeek, currentTime]);

  // Calculate current time position (percentage of day)
  const currentTimePosition = useMemo(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return ((hours * 60 + minutes) / 60) * HOUR_HEIGHT;
  }, [currentTime]);

  useEffect(() => {
    if (gridRef.current) {
      const viewportHeight = gridRef.current.clientHeight;
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const scrollPosition = currentHour * HOUR_HEIGHT - viewportHeight / 2;
      gridRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      {/* Day headers */}
      <div className="flex min-w-[640px] sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="w-12 shrink-0 sm:w-16" />
        {daysOfWeek.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isWeekendDay = isWeekend(day);
          const isPast = isBefore(day, new Date()) && !isToday;

          return (
            <div
              key={day.toISOString()}
              className={`min-w-[80px] flex-1 py-3 text-center transition-colors ${
                isWeekendDay ? "bg-muted/30" : ""
              }`}
            >
              <div
                className={`text-xs font-medium uppercase tracking-wide ${
                  isToday
                    ? "text-primary"
                    : isPast
                      ? "text-muted-foreground/60"
                      : isWeekendDay
                        ? "text-muted-foreground/80"
                        : "text-muted-foreground"
                }`}
              >
                {format(day, "EEE")}
              </div>
              <div
                className={`mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  isToday
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isPast
                      ? "text-muted-foreground/60"
                      : "text-foreground hover:bg-muted"
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      <CalendarAllDayEvents
        events={allDayEvents}
        daysOfWeek={daysOfWeek}
        calendars={calendars}
        setSelectedEvent={setSelectedEvent}
      />

      {/* Time grid */}
      <div className="flex flex-1 overflow-auto" ref={gridRef}>
        <div className="min-w-[640px] flex flex-1">
          {/* Hour labels */}
          <div className="w-12 shrink-0 sm:w-16 border-r border-border/50">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative h-16 pr-2 text-right text-[11px] font-medium text-muted-foreground/70"
              >
                <span className="absolute -top-2 right-2">
                  {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="relative grid flex-1 grid-cols-7">
            {daysOfWeek.map((day, dayIndex) => {
              const isWeekendDay = isWeekend(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`relative min-w-[80px] ${isWeekendDay ? "bg-muted/20" : ""}`}
                >
                  {/* Hour grid lines */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className={`h-16 border-t ${
                        hour === 0 ? "border-transparent" : "border-border/40"
                      } ${dayIndex < 6 ? "border-r border-r-border/30" : ""}`}
                    />
                  ))}

                  {/* Current time indicator */}
                  {isToday && currentDayIndex === dayIndex && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      <div className="relative flex items-center">
                        <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-red-500 shadow-sm" />
                        <div className="h-[2px] w-full bg-red-500 shadow-sm" />
                      </div>
                    </div>
                  )}

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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
