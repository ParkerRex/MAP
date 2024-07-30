"use client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@map/ui/context-menu";
import type { calendar_v3 } from "googleapis";
import { DateTime, Interval } from "luxon";
import React, { useMemo } from "react";
import type { FC } from "react";
import { useCalendar } from "../contexts/CalendarContext";
import { formatForDisplay, safeParseDate } from "../utils/dateUtils";

interface CalendarEventProps {
  events: calendar_v3.Schema$Event[];
  dayIndex: number;
}

const MINUTES_IN_HOUR = 60;
const HOUR_HEIGHT = 64;

const CalendarEventComponent: FC<CalendarEventProps> = ({
  events,
  dayIndex,
}) => {
  const { setSelectedEvent, calendars, userTimeZone } = useCalendar();
  const now = DateTime.now().setZone(userTimeZone);

  const handleEventClick = (event: calendar_v3.Schema$Event) => {
    setSelectedEvent(event);
  };

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#DDFFE3";
  };

  const sortedEvents = useMemo(() => {
    return events.sort((a, b) => {
      const startA = safeParseDate(
        a.start?.dateTime || a.start?.date || "",
      )?.setZone(userTimeZone);
      const startB = safeParseDate(
        b.start?.dateTime || b.start?.date || "",
      )?.setZone(userTimeZone);
      return (startA?.toMillis() || 0) - (startB?.toMillis() || 0);
    });
  }, [events, userTimeZone]);

  const calculateEventStyle = (event: calendar_v3.Schema$Event) => {
    const startDate = safeParseDate(
      event.start?.dateTime || event.start?.date || "",
    )?.setZone(userTimeZone);
    const endDate = safeParseDate(
      event.end?.dateTime || event.end?.date || "",
    )?.setZone(userTimeZone);
    if (!startDate || !endDate) return {};

    const dayStart = startDate.startOf("day");
    const dayEnd = startDate.endOf("day");

    const top =
      (startDate.diff(dayStart, "minutes").minutes / MINUTES_IN_HOUR) *
      HOUR_HEIGHT;
    const height =
      (endDate.diff(startDate, "minutes").minutes / MINUTES_IN_HOUR) *
      HOUR_HEIGHT;

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: "0",
      right: "0",
    };
  };

  return (
    <div className="absolute inset-0">
      {sortedEvents.map((event) => {
        const endDate = safeParseDate(
          event.end?.dateTime || event.end?.date || "",
        )?.setZone(userTimeZone);
        const isPastEvent = endDate ? endDate < now : false;
        const calendarColor = getCalendarColor(event.organizer?.email);
        const style = calculateEventStyle(event);

        return (
          <ContextMenu key={event.id}>
            <ContextMenuTrigger>
              <div
                className="absolute select-none p-1 rounded-lg border-l-4 overflow-hidden cursor-pointer"
                style={{
                  ...style,
                  backgroundColor: `${calendarColor}33`, // Add 33 for 20% opacity
                  borderLeftColor: calendarColor,
                }}
                onClick={() => handleEventClick(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleEventClick(event);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Event: ${event.summary}`}
              >
                <div className="flex flex-col h-full w-full overflow-hidden">
                  <p className="text-[11px] font-semibold line-clamp-1">
                    {event.summary}
                  </p>
                  <p className="text-[10px] line-clamp-1 font-mono tracking-tight">
                    {formatForDisplay(
                      event.start?.dateTime || event.start?.date,
                      "HH:mm",
                    )}
                    {" - "}
                    {formatForDisplay(
                      event.end?.dateTime || event.end?.date,
                      "HH:mm",
                    )}
                  </p>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => {}}>
                Delete Event
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
};

export default CalendarEventComponent;
