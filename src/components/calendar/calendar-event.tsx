"use client";
import { useCalendar } from "@/store/calendar-context";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { calendar_v3 } from "googleapis";
import type React from "react";
import { useMemo } from "react";

interface CalendarEventProps {
  events: calendar_v3.Schema$Event[];
  dayIndex: number;
}

const MINUTES_IN_HOUR = 60;
const HOUR_HEIGHT = 64;

const CalendarEventComponent: React.FC<CalendarEventProps> = ({
  events,
  dayIndex: _dayIndex,
}) => {
  const { setSelectedEvent, calendars } = useCalendar();

  const handleEventClick = (event: calendar_v3.Schema$Event) => {
    setSelectedEvent(event);
  };

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#DDFFE3";
  };

  const sortedEvents = useMemo(() => {
    return events.sort((a, b) => {
      const startA = new Date(
        a.start?.dateTime || a.start?.date || "",
      ).getTime();
      const startB = new Date(
        b.start?.dateTime || b.start?.date || "",
      ).getTime();
      return startA - startB;
    });
  }, [events]);

  const calculateEventStyle = (event: calendar_v3.Schema$Event) => {
    const startDate = new Date(
      event.start?.dateTime || event.start?.date || "",
    );
    const endDate = new Date(event.end?.dateTime || event.end?.date || "");
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);

    const top =
      ((startDate.getHours() * 60 + startDate.getMinutes()) / MINUTES_IN_HOUR) *
      HOUR_HEIGHT;
    const height =
      ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)) *
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
        const endDate = new Date(event.end?.dateTime || event.end?.date || "");
        const _isPastEvent = endDate < new Date();
        const calendarColor = getCalendarColor(event.organizer?.email);
        const style = calculateEventStyle(event);

        return (
          <ContextMenu key={event.id}>
            <ContextMenuTrigger>
              <div
                className="absolute select-none p-1 rounded-lg border-l-4 overflow-hidden cursor-pointer"
                style={{
                  ...style,
                  backgroundColor: `${calendarColor}33`,
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
                    {event.start?.dateTime || event.start?.date} -{" "}
                    {event.end?.dateTime || event.end?.date}
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
