"use client";
import { isWeekend } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { ExtendedEvent } from "@/types/calendar";

interface CalendarAllDayEventsProps {
  events: calendar_v3.Schema$Event[];
  daysOfWeek: Date[];
  calendars: calendar_v3.Schema$CalendarListEntry[];
  onEventClick: (event: ExtendedEvent) => void;
  onEventDelete: (event: calendar_v3.Schema$Event) => void;
}

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

export default function CalendarAllDayEvents({
  events,
  daysOfWeek,
  calendars,
  onEventClick,
  onEventDelete,
}: CalendarAllDayEventsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Filter all-day events early to check if section should render
  const allDayEvents = events.filter((event) => !!event.start?.date);

  // Hide the entire section when there are no all-day events
  if (allDayEvents.length === 0) {
    return null;
  }

  const handleEventClick = (event: calendar_v3.Schema$Event) => {
    onEventClick(event);
  };

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#3b82f6";
  };

  const visibleEvents = isExpanded ? allDayEvents : allDayEvents.slice(0, 2);
  const hiddenEventsCount = allDayEvents.length - visibleEvents.length;

  return (
    <div className="border-b border-border bg-muted/20">
      <div className="flex justify-between items-center px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          All Day
        </span>
        {allDayEvents.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse all-day events" : "Expand all-day events"}
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
      <div
        className={`transition-all duration-200 ease-out ${isExpanded ? "max-h-[200px]" : "max-h-16"} overflow-hidden`}
      >
        <div className="flex min-h-8 pb-2">
          <div className="w-12 sm:w-16 shrink-0" />
          <div className="grow grid grid-cols-7">
            {daysOfWeek.map((day, dayIndex) => {
              const isWeekendDay = isWeekend(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`px-0.5 ${dayIndex < 6 ? "border-r border-border/30" : ""} ${isWeekendDay ? "bg-muted/20" : ""}`}
                >
                  {visibleEvents
                    .filter((event) => {
                      const eventStart = event.start?.date || event.start?.dateTime;
                      return new Date(eventStart!).toDateString() === day.toDateString();
                    })
                    .map((event) => {
                      const calendarColor = getCalendarColor(event.organizer?.email);
                      const rgb = hexToRgb(calendarColor);
                      const bgColor = rgb
                        ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
                        : `${calendarColor}26`;

                      return (
                        <ContextMenu key={event.id}>
                          <ContextMenuTrigger>
                            <div
                              className="rounded-md px-1.5 py-0.5 text-[11px] mb-0.5 truncate cursor-pointer border-l-[3px] transition-all duration-150 hover:shadow-sm"
                              style={{
                                backgroundColor: bgColor,
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
                              aria-label={`All-day event: ${event.summary}`}
                            >
                              <span className="font-medium text-foreground/90">
                                {event.summary}
                              </span>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onSelect={() => onEventDelete(event)}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete Event
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {!isExpanded && hiddenEventsCount > 0 && (
        <div className="text-xs text-muted-foreground px-4 pb-2">+{hiddenEventsCount} more</div>
      )}
    </div>
  );
}
