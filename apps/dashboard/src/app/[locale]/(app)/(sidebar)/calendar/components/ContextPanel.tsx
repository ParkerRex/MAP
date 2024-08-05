// /app/calendar/components/ContextPanel.tsx
"use client";
import type { calendar_v3 } from "googleapis";
import { MoveRight } from "lucide-react";
import { DateTime } from "luxon";
import { useCalendar } from "../contexts/CalendarContext";
import { formatForDisplay, safeParseDate } from "../utils/dateUtils";

interface ContextPanelProps {
  className?: string;
}

export default function ContextPanel({ className }: ContextPanelProps) {
  const { selectedEvent, events, visibleCalendars, calendars, userTimeZone } =
    useCalendar();

  const getNextEvent = (): calendar_v3.Schema$Event | undefined => {
    const now = DateTime.now().setZone(userTimeZone);
    const visibleEvents = events.filter((event) =>
      visibleCalendars.has(event.organizer?.email || ""),
    );
    const upcomingEvents = visibleEvents.filter((event) => {
      const startDateTime = safeParseDate(
        event.start?.dateTime || event.start?.date,
      );
      return startDateTime && startDateTime > now;
    });
    upcomingEvents.sort((a, b) => {
      const aStartDateTime = safeParseDate(a.start?.dateTime || a.start?.date);
      const bStartDateTime = safeParseDate(b.start?.dateTime || b.start?.date);
      return aStartDateTime && bStartDateTime
        ? aStartDateTime.toMillis() - bStartDateTime.toMillis()
        : 0;
    });
    return upcomingEvents[0];
  };

  const getTimeUntilNextEvent = (event: calendar_v3.Schema$Event) => {
    const now = DateTime.now().setZone(userTimeZone);
    const eventStart = safeParseDate(
      event.start?.dateTime || event.start?.date,
    );
    if (!eventStart) return { hours: 0, minutes: 0 };
    const diff = eventStart.diff(now, ["hours", "minutes"]);
    return {
      hours: Math.floor(diff.hours),
      minutes: Math.floor(diff.minutes % 60),
    };
  };

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#DDFFE3";
  };

  const getEventDates = (event: calendar_v3.Schema$Event) => {
    return {
      startDate: safeParseDate(event.start?.dateTime || event.start?.date),
      endDate: safeParseDate(event.end?.dateTime || event.end?.date),
    };
  };

  if (!selectedEvent) {
    const nextEvent = getNextEvent();
    if (!nextEvent) {
      return (
        <div
          className={`w-[256px] min-w-[256px] h-screen bg-white dark:bg-[#262626] ${className}`}
        >
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <p>No upcoming events</p>
            </div>
          </div>
        </div>
      );
    }

    const { hours, minutes } = getTimeUntilNextEvent(nextEvent);
    const { summary, description } = nextEvent;
    const { startDate, endDate } = getEventDates(nextEvent);
    const formattedDate = startDate?.toJSDate().toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return (
      <div
        className={`w-[256px] min-w-[256px] h-screen bg-white dark:bg-[#262626] ${className}`}
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center justify-between text-[11px]">
              Upcoming in {hours}h {minutes}min
            </p>
            <MoveRight className="size-4" />
          </div>
          <div className="bg-gray-100 dark:bg-[#404040] p-4 rounded-lg">
            <h2 className="text-[11px] font-semibold line-clamp-1">
              {summary}
            </h2>
            <p className="text-[11px]">
              {startDate && formatForDisplay(startDate.toJSDate(), "h:mm a")}
              {" - "}
              {endDate && formatForDisplay(endDate.toJSDate(), "h:mm a")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, description } = selectedEvent;
  const { startDate, endDate } = getEventDates(selectedEvent);
  const formattedDate = startDate?.toJSDate().toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`w-[256px] min-w-[256px] h-screen bg-white dark:bg-[#262626] ${className}`}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center justify-between text-[11px]">
            Event Details
          </p>
          <MoveRight className="size-4" />
        </div>
        <div className="bg-gray-100 dark:bg-[#404040] p-4 rounded-lg">
          <h2 className="text-[11px] font-semibold line-clamp-1">{summary}</h2>
          <p className="text-[11px]">
            {startDate && formatForDisplay(startDate.toJSDate(), "h:mm a")}
            {startDate && endDate && " - "}
            {endDate && formatForDisplay(endDate.toJSDate(), "h:mm a")}
          </p>
          <p className="text-[11px]">{description}</p>
        </div>
      </div>
    </div>
  );
}
