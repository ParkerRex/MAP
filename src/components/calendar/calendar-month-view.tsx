"use client";

import {
  addDays,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { calendar_v3 } from "googleapis";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

interface CalendarMonthViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: calendar_v3.Schema$Event[];
  calendars: calendar_v3.Schema$CalendarListEntry[];
  onEventClick: (event: calendar_v3.Schema$Event) => void;
  onEventDelete: (event: calendar_v3.Schema$Event) => void;
  onCreateEvent: () => void;
}

function getCalendarColor(
  calendars: calendar_v3.Schema$CalendarListEntry[],
  calendarId: string | null | undefined,
) {
  const calendar = calendars.find((cal) => cal.id === calendarId);
  return calendar?.backgroundColor || "#3b82f6";
}

export default function CalendarMonthView({
  selectedDate,
  onSelectDate,
  events,
  calendars,
  onEventClick,
  onEventDelete,
  onCreateEvent,
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridDays = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  const eventsForDate = (date: Date) =>
    events
      .filter((event) => {
        const start = event.start?.dateTime || event.start?.date;
        return start ? isSameDay(new Date(start), date) : false;
      })
      .sort((a, b) => {
        const aStart = new Date(a.start?.dateTime || a.start?.date || "").getTime();
        const bStart = new Date(b.start?.dateTime || b.start?.date || "").getTime();
        return aStart - bStart;
      });

  const selectedDayEvents = eventsForDate(selectedDate);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur-md">
        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {gridDays.map((date) => {
            const inMonth = isSameMonth(date, selectedDate);
            const selected = isSameDay(date, selectedDate);
            const dayEvents = eventsForDate(date);
            const colors = Array.from(
              new Set(dayEvents.map((event) => getCalendarColor(calendars, event.organizer?.email))),
            ).slice(0, 3);

            return (
              <button
                key={date.toISOString()}
                type="button"
                className={`flex h-16 flex-col items-center justify-center gap-1 rounded-xl border ${
                  selected
                    ? "border-primary/40 bg-primary/10"
                    : "border-transparent hover:bg-muted/40"
                }`}
                onClick={() => onSelectDate(date)}
              >
                <span
                  className={`text-sm font-semibold ${
                    selected
                      ? "text-primary"
                      : isToday(date)
                        ? "text-primary"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                  }`}
                >
                  {format(date, "d")}
                </span>
                <div className="flex h-2 items-center gap-1">
                  {colors.map((color) => (
                    <span key={color} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(selectedDate, "EEEE, MMM d")}
        </h3>
        <Button size="sm" onClick={onCreateEvent}>
          Add Event
        </Button>
      </div>

      {selectedDayEvents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 py-10 text-muted-foreground">
          <span className="text-sm font-medium">No events</span>
          <p className="text-xs text-muted-foreground/80">
            Tap a date to plan your month and add key moments.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" onClick={onCreateEvent}>
              Add Event
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onSelectDate(new Date())}>
              Jump to Today
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedDayEvents.map((event) => {
            const color = getCalendarColor(calendars, event.organizer?.email);
            const start = event.start?.dateTime || event.start?.date;
            const end = event.end?.dateTime || event.end?.date;
            return (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => onEventClick(event)}
                  className="flex items-center gap-2 text-left"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <div>
                    <p className="text-sm font-semibold">{event.summary ?? "Untitled"}</p>
                    {start && (
                      <p className="text-xs text-muted-foreground">
                        {event.start?.date ? "All day" : `${format(new Date(start), "h:mm a")}`}
                        {end && event.start?.dateTime ? ` - ${format(new Date(end), "h:mm a")}` : ""}
                      </p>
                    )}
                  </div>
                </button>
                <Button variant="ghost" size="sm" onClick={() => onEventDelete(event)}>
                  Delete
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
