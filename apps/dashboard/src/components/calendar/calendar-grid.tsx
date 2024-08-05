"use client";
import { useCalendar } from "@/store/calendar-context";
import type { CalendarEvent } from "@/types/calendar";
import { safeParseDate } from "@/utils/date-utils";
import type { calendar_v3 } from "googleapis";
import { DateTime, Interval } from "luxon";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import CalendarAllDayEvents from "./all-day-events";
import CalendarEventComponent from "./calendar-event";

interface CalendarGridProps {
  className?: string;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  events: calendar_v3.Schema$Event[];
}

const CalendarGrid: FC<CalendarGridProps> = ({
  className,
  calendars,
  events,
}) => {
  const { currentWeekStartDate, visibleCalendars, userTimeZone } =
    useCalendar();
  const gridRef = useRef<HTMLDivElement>(null);
  const startOfWeek = DateTime.fromJSDate(currentWeekStartDate)
    .startOf("week")
    .plus({ days: 1 });
  const endOfWeek = startOfWeek.plus({ days: 6 });
  const daysOfWeek = Interval.fromDateTimes(startOfWeek, endOfWeek)
    .splitBy({ days: 1 })
    .map((d) => d.start)
    .filter((day): day is DateTime => day !== null);

  const isAllDayEvent = (event: CalendarEvent) => {
    const start = safeParseDate(event.start?.dateTime || event.start?.date);
    const end = safeParseDate(event.end?.dateTime || event.end?.date);
    return (
      event.start?.date !== undefined ||
      (start && end && end.diff(start).as("hours") >= 24)
    );
  };

  const filteredEvents = events.filter(
    (event) =>
      event.organizer?.email && visibleCalendars.has(event.organizer.email),
  );

  const allDayEvents = filteredEvents.filter(isAllDayEvent);
  const regularEvents = filteredEvents.filter((event) => !isAllDayEvent(event));

  useEffect(() => {
    if (gridRef.current) {
      const gridHeight = gridRef.current.scrollHeight;
      const viewportHeight = gridRef.current.clientHeight;
      const hourHeight = gridHeight / 24;
      const now = DateTime.now().setZone(userTimeZone);
      const currentHour = now.hour + now.minute / 60;
      const scrollPosition = currentHour * hourHeight - viewportHeight / 2;
      gridRef.current.scrollTop = scrollPosition;
    }
  }, [userTimeZone]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <div className="flex sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="w-16 flex-shrink-0" />
        {daysOfWeek.map((day) => (
          <div key={day.toISO()} className="flex-1 text-center p-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {day.toFormat("EEE")}
            </div>
            <div
              className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full ${
                day.hasSame(DateTime.now().setZone(userTimeZone), "day")
                  ? "bg-[#48CA80] text-white"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {day.toFormat("d")}
            </div>
          </div>
        ))}
      </div>
      <CalendarAllDayEvents
        events={allDayEvents}
        daysOfWeek={daysOfWeek.map((d) => d.toJSDate())}
      />
      <div className="flex flex-grow overflow-y-auto" ref={gridRef}>
        <div className="w-16 flex-shrink-0">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 text-xs text-gray-500 text-right pr-2"
            >
              {DateTime.fromObject({ hour }, { zone: userTimeZone }).toFormat(
                "h a",
              )}
            </div>
          ))}
        </div>
        <div className="flex-grow grid grid-cols-7 relative">
          {daysOfWeek.map((day, dayIndex) => (
            <div key={day.toISO()} className="relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-t border-gray-200 dark:border-gray-700"
                />
              ))}
              <CalendarEventComponent
                events={regularEvents.filter((event) => {
                  const eventStart = safeParseDate(
                    event.start?.dateTime || event.start?.date,
                  );
                  return eventStart?.hasSame(day, "day");
                })}
                dayIndex={dayIndex}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
