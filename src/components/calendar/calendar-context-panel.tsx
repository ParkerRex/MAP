"use client";
import { format } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { MoveRight } from "lucide-react";
import type { ExtendedEvent } from "@/types/calendar";

const formatTime = (date: Date) => format(date, "h:mm a");

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
      // Hide the panel completely when there are no upcoming events
      return null;
    }

    const { hours, minutes } = getTimeUntilNextEvent(nextEvent);
    const { summary, description: _description } = nextEvent;
    const startDate = new Date(nextEvent.start?.dateTime || nextEvent.start?.date || "");
    const endDate = new Date(nextEvent.end?.dateTime || nextEvent.end?.date || "");

    return (
      <div className={`h-full w-[256px] border-l bg-muted/30 dark:bg-muted/10 ${className}`}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Upcoming in {hours}h {minutes}min
            </p>
            <MoveRight className="size-4 text-muted-foreground" />
          </div>
          <div className="rounded-lg bg-muted p-4">
            <h2 className="line-clamp-1 text-sm font-semibold">{summary}</h2>
            <p className="text-xs text-muted-foreground">
              {formatTime(startDate)} - {formatTime(endDate)}
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
    <div className={`h-full w-[256px] border-l bg-muted/30 dark:bg-muted/10 ${className}`}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Event Details</p>
          <MoveRight className="size-4 text-muted-foreground" />
        </div>
        <div className="rounded-lg bg-muted p-4">
          <h2 className="line-clamp-1 text-sm font-semibold">{summary}</h2>
          <p className="text-xs text-muted-foreground">
            {formatTime(startDate)} - {formatTime(endDate)}
          </p>
          {description && <p className="mt-2 text-xs">{description}</p>}
        </div>
      </div>
    </div>
  );
}
