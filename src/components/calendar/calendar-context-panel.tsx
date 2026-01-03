"use client";
import { format, formatDistanceToNow } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ExtendedEvent } from "@/types/calendar";

const formatTime = (date: Date) => format(date, "h:mm a");
const formatDate = (date: Date) => format(date, "EEE, MMM d");

// Convert hex to RGB for better color manipulation
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

interface ContextPanelProps {
  className?: string;
  selectedEvent: ExtendedEvent | null;
  events: calendar_v3.Schema$Event[];
  visibleCalendars: Set<string>;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  onClearSelection?: () => void;
}

export default function ContextPanel({
  className,
  selectedEvent,
  events,
  visibleCalendars,
  calendars,
  onClearSelection,
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

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#3b82f6";
  };

  const getCalendarName = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.summary || "Calendar";
  };

  if (!selectedEvent) {
    const nextEvent = getNextEvent();
    if (!nextEvent) {
      return null;
    }

    const startDate = new Date(nextEvent.start?.dateTime || nextEvent.start?.date || "");
    const endDate = new Date(nextEvent.end?.dateTime || nextEvent.end?.date || "");
    const timeUntil = formatDistanceToNow(startDate, { addSuffix: false });
    const calendarColor = getCalendarColor(nextEvent.organizer?.email);
    const rgb = hexToRgb(calendarColor);
    const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : `${calendarColor}1a`;

    return (
      <aside className={`h-full w-[280px] border-l border-border/50 bg-background ${className}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Up Next
            </p>
            <p className="text-sm text-primary font-medium mt-0.5">in {timeUntil}</p>
          </div>

          <div className="p-4 flex-1">
            <div
              className="rounded-lg p-4 border-l-[3px]"
              style={{
                backgroundColor: bgColor,
                borderLeftColor: calendarColor,
              }}
            >
              <h2 className="font-semibold text-foreground line-clamp-2">{nextEvent.summary}</h2>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(startDate)} - {formatTime(endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(startDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const { summary, description, location } = selectedEvent;
  const startDate = new Date(selectedEvent.start?.dateTime || selectedEvent.start?.date || "");
  const endDate = new Date(selectedEvent.end?.dateTime || selectedEvent.end?.date || "");
  const calendarColor = getCalendarColor(selectedEvent.organizer?.email);
  const calendarName = getCalendarName(selectedEvent.organizer?.email);
  const rgb = hexToRgb(calendarColor);
  const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : `${calendarColor}1a`;

  return (
    <aside className={`h-full w-[280px] border-l border-border/50 bg-background ${className}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Event Details
          </p>
          {onClearSelection && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearSelection}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <div
            className="rounded-lg p-4 border-l-[3px]"
            style={{
              backgroundColor: bgColor,
              borderLeftColor: calendarColor,
            }}
          >
            <h2 className="font-semibold text-foreground">{summary}</h2>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {formatTime(startDate)} - {formatTime(endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(startDate)}</span>
              </div>
              {location && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{location}</span>
                </div>
              )}
            </div>
          </div>

          {description && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Description
                </p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{description}</p>
              </div>
            </>
          )}

          <Separator className="my-4" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: calendarColor }} />
            <span className="text-xs text-muted-foreground">{calendarName}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
