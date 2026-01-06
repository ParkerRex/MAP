"use client";

import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

interface CalendarWeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
  events: calendar_v3.Schema$Event[];
  calendars: calendar_v3.Schema$CalendarListEntry[];
  showHeader?: boolean;
}

function getCalendarColor(
  calendars: calendar_v3.Schema$CalendarListEntry[],
  calendarId: string | null | undefined,
) {
  const calendar = calendars.find((cal) => cal.id === calendarId);
  return calendar?.backgroundColor || "#3b82f6";
}

export default function CalendarWeekStrip({
  selectedDate,
  onSelectDate,
  onDateDoubleClick,
  events,
  calendars,
  showHeader = false,
}: CalendarWeekStripProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const monthYear = format(selectedDate, "MMMM yyyy");

  const eventColorsForDate = (date: Date) => {
    const dayEvents = events.filter((event) => {
      const start = event.start?.dateTime || event.start?.date;
      return start ? isSameDay(new Date(start), date) : false;
    });
    const colors = Array.from(
      new Set(dayEvents.map((event) => getCalendarColor(calendars, event.organizer?.email))),
    );
    return colors.slice(0, 3);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-3 shadow-sm backdrop-blur-md">
      {showHeader && (
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-base font-semibold">{monthYear}</h2>
          {!isToday(selectedDate) && (
            <Button size="sm" variant="ghost" onClick={() => onSelectDate(new Date())}>
              Today
            </Button>
          )}
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((date) => {
          const selected = isSameDay(date, selectedDate);
          const today = isToday(date);
          const colors = eventColorsForDate(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              onDoubleClick={() => onDateDoubleClick?.(date)}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-center transition-colors ${
                selected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/40"
              }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase ${
                  today ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {format(date, "EEE")}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : today
                      ? "border border-primary text-primary"
                      : "text-foreground"
                }`}
              >
                {format(date, "d")}
              </span>
              <div className="flex h-2 items-center gap-1">
                {colors.length > 0
                  ? colors.map((color) => (
                      <span
                        key={color}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))
                  : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
