"use client";
import type { calendar_v3 } from "googleapis";
import { MoveRight } from "lucide-react";
import type { ExtendedEvent } from "@/types/calendar";

interface ContextPanelProps {
  className?: string;
  selectedEvent: ExtendedEvent | null;
  events: calendar_v3.Schema$Event[];
  visibleCalendars: Set<string>;
  calendars: calendar_v3.Schema$CalendarListEntry[];
}

export default function ContextPanel({
  className,
  selectedEvent,
  events,
  visibleCalendars,
  calendars,
}: ContextPanelProps) {
  const getNextEvent = (): calendar_v3.Schema$Event | undefined => {
    const now = new Date();
    const visibleEvents = events.filter((event) =>
      visibleCalendars.has(event.organizer?.email || ""),
    );
    const upcomingEvents = visibleEvents.filter((event) => {
      const startDateTime = new Date(event.start?.dateTime || event.start?.date || "");
      return startDateTime > now;
    });
    upcomingEvents.sort((a, b) => {
      const aStartDateTime = new Date(a.start?.dateTime || a.start?.date || "");
      const bStartDateTime = new Date(b.start?.dateTime || b.start?.date || "");
      return aStartDateTime.getTime() - bStartDateTime.getTime();
    });
    return upcomingEvents[0];
  };

  const getTimeUntilNextEvent = (event: calendar_v3.Schema$Event) => {
    const now = new Date();
    const eventStart = new Date(event.start?.dateTime || event.start?.date || "");
    const diff = eventStart.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  const _getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#DDFFE3";
  };

  if (!selectedEvent) {
    const nextEvent = getNextEvent();
    if (!nextEvent) {
      return (
        <div className={`w-[256px] min-w-[256px] h-screen bg-white dark:bg-[#262626] ${className}`}>
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <p>No upcoming events</p>
            </div>
          </div>
        </div>
      );
    }

    const { hours, minutes } = getTimeUntilNextEvent(nextEvent);
    const { summary, description: _description } = nextEvent;
    const startDate = new Date(nextEvent.start?.dateTime || nextEvent.start?.date || "");
    const endDate = new Date(nextEvent.end?.dateTime || nextEvent.end?.date || "");

    return (
      <div className={`w-[256px] min-w-[256px] h-screen bg-white dark:bg-[#262626] ${className}`}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center justify-between text-[11px]">
              Upcoming in {hours}h {minutes}min
            </p>
            <MoveRight className="size-4" />
          </div>
          <div className="bg-gray-100 dark:bg-[#404040] p-4 rounded-lg">
            <h2 className="text-[11px] font-semibold line-clamp-1">{summary}</h2>
            <p className="text-[11px]">
              {startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, description } = selectedEvent;
  const startDate = new Date(selectedEvent.start?.dateTime || selectedEvent.start?.date || "");
  const endDate = new Date(selectedEvent.end?.dateTime || selectedEvent.end?.date || "");

  return (
    <div className={`w-[256px] min-w-[256px] h-screen bg-white dark:bg-[#262626] ${className}`}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center justify-between text-[11px]">Event Details</p>
          <MoveRight className="size-4" />
        </div>
        <div className="bg-gray-100 dark:bg-[#404040] p-4 rounded-lg">
          <h2 className="text-[11px] font-semibold line-clamp-1">{summary}</h2>
          <p className="text-[11px]">
            {startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}
          </p>
          <p className="text-[11px]">{description}</p>
        </div>
      </div>
    </div>
  );
}
