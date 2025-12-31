import { useCalendar } from "@/store/calendar-context";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { calendar_v3 } from "googleapis";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

interface CalendarAllDayEventsProps {
  events: calendar_v3.Schema$Event[];
  daysOfWeek: Date[];
}

export default function CalendarAllDayEvents({
  events,
  daysOfWeek,
}: CalendarAllDayEventsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { setSelectedEvent, calendars } = useCalendar();

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleEventClick = (event: calendar_v3.Schema$Event) => {
    setSelectedEvent(event);
  };

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#DDFFE3";
  };

  const isAllDayEvent = (event: calendar_v3.Schema$Event) => {
    return !!event.start?.date;
  };

  const allDayEvents = events.filter(isAllDayEvent);
  const visibleEvents = isExpanded ? allDayEvents : allDayEvents.slice(0, 2);
  const hiddenEventsCount = allDayEvents.length - visibleEvents.length;

  const getEventSpan = (event: calendar_v3.Schema$Event) => {
    // Implement the logic to calculate event span
    return 1; // Default to 1 day span
  };

  return (
    <div className="border-b border-gray-200">
      <div className="flex justify-between items-center px-4 py-2">
        <span className="text-sm font-medium">All-Day Events</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-label={
            isExpanded ? "Collapse all-day events" : "Expand all-day events"
          }
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[1000px]" : "max-h-24"} overflow-hidden`}
      >
        <div className="flex border-b border-gray-200 min-h-[2rem]">
          <div className="w-16 flex-shrink-0" />
          <div className="flex-grow grid grid-cols-7">
            {daysOfWeek.map((day) => (
              <div
                key={day.toISOString()}
                className="border-r border-gray-200 p-1"
              >
                {visibleEvents
                  .filter((event) => {
                    const eventStart =
                      event.start?.date || event.start?.dateTime;
                    return (
                      new Date(eventStart!).toDateString() ===
                      day.toDateString()
                    );
                  })
                  .map((event) => (
                    <ContextMenu key={event.id}>
                      <ContextMenuTrigger>
                        <div
                          className="rounded px-2 py-1 text-xs mb-1 truncate cursor-pointer"
                          style={{
                            backgroundColor: `${getCalendarColor(event.organizer?.email)}33`,
                            borderLeft: `4px solid ${getCalendarColor(event.organizer?.email)}`,
                            gridColumn: `span ${getEventSpan(event)}`,
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
                          {event.summary}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onSelect={() => {}}>
                          Delete Event
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {!isExpanded && hiddenEventsCount > 0 && (
        <div className="text-sm text-gray-500 px-4 py-2">
          +{hiddenEventsCount} more event{hiddenEventsCount > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
