"use client";
import { format } from "date-fns";
import type { calendar_v3 } from "googleapis";
import type React from "react";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/components/ui/use-toast";
import { useDeleteEvent } from "@/hooks/use-calendar";
import type { ExtendedEvent } from "@/types/calendar";

interface CalendarEventProps {
  events: calendar_v3.Schema$Event[];
  dayIndex: number;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  setSelectedEvent: (event: ExtendedEvent | null) => void;
}

const MINUTES_IN_HOUR = 60;
const HOUR_HEIGHT = 64;

const CalendarEventComponent: React.FC<CalendarEventProps> = ({
  events,
  dayIndex: _dayIndex,
  calendars,
  setSelectedEvent,
}) => {
  const [eventToDelete, setEventToDelete] = useState<calendar_v3.Schema$Event | null>(null);
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const handleEventClick = (event: calendar_v3.Schema$Event) => {
    setSelectedEvent(event);
  };

  const handleDeleteEvent = async (event: calendar_v3.Schema$Event) => {
    const calendarId = event.organizer?.email;
    if (!calendarId || !event.id) {
      toast({ title: "Error", description: "Cannot delete event", variant: "destructive" });
      return;
    }

    try {
      await deleteEvent.mutateAsync({ calendarId, eventId: event.id });
      toast({ title: "Success", description: "Event deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    }
    setEventToDelete(null);
  };

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#DDFFE3";
  };

  const formatEventTime = (dateTimeStr: string | null | undefined) => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return format(date, "h:mm a");
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const startA = new Date(a.start?.dateTime || a.start?.date || "").getTime();
      const startB = new Date(b.start?.dateTime || b.start?.date || "").getTime();
      return startA - startB;
    });
  }, [events]);

  // Calculate overlapping events and their positions
  const eventsWithLayout = useMemo(() => {
    const groups: calendar_v3.Schema$Event[][] = [];

    for (const event of sortedEvents) {
      const eventStart = new Date(event.start?.dateTime || event.start?.date || "").getTime();
      const eventEnd = new Date(event.end?.dateTime || event.end?.date || "").getTime();

      // Find a group where this event overlaps with at least one event
      let foundGroup = false;
      for (const group of groups) {
        const overlaps = group.some((e) => {
          const eStart = new Date(e.start?.dateTime || e.start?.date || "").getTime();
          const eEnd = new Date(e.end?.dateTime || e.end?.date || "").getTime();
          return eventStart < eEnd && eventEnd > eStart;
        });

        if (overlaps) {
          group.push(event);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        groups.push([event]);
      }
    }

    // Assign column positions within each group
    const eventPositions = new Map<string, { column: number; totalColumns: number }>();

    for (const group of groups) {
      const columns: calendar_v3.Schema$Event[][] = [];

      for (const event of group) {
        const eventStart = new Date(event.start?.dateTime || event.start?.date || "").getTime();

        // Find the first column where this event fits
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const lastInColumn = columns[i][columns[i].length - 1];
          const lastEnd = new Date(
            lastInColumn.end?.dateTime || lastInColumn.end?.date || "",
          ).getTime();

          if (eventStart >= lastEnd) {
            columns[i].push(event);
            eventPositions.set(event.id || "", { column: i, totalColumns: columns.length });
            placed = true;
            break;
          }
        }

        if (!placed) {
          columns.push([event]);
          eventPositions.set(event.id || "", {
            column: columns.length - 1,
            totalColumns: columns.length,
          });
        }
      }

      // Update total columns for all events in this group
      for (const event of group) {
        const pos = eventPositions.get(event.id || "");
        if (pos) {
          eventPositions.set(event.id || "", { ...pos, totalColumns: columns.length });
        }
      }
    }

    return { sortedEvents, eventPositions };
  }, [sortedEvents]);

  const calculateEventStyle = (event: calendar_v3.Schema$Event) => {
    const startDate = new Date(event.start?.dateTime || event.start?.date || "");
    const endDate = new Date(event.end?.dateTime || event.end?.date || "");

    const top =
      ((startDate.getHours() * 60 + startDate.getMinutes()) / MINUTES_IN_HOUR) * HOUR_HEIGHT;
    const height = Math.max(
      ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT,
      20,
    );

    const position = eventsWithLayout.eventPositions.get(event.id || "");
    const column = position?.column ?? 0;
    const totalColumns = position?.totalColumns ?? 1;
    const width = 100 / totalColumns;
    const left = column * width;

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `${left}%`,
      width: `calc(${width}% - 2px)`,
    };
  };

  return (
    <>
      <div className="absolute inset-0">
        {eventsWithLayout.sortedEvents.map((event) => {
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
                    <p className="text-[11px] font-semibold line-clamp-1">{event.summary}</p>
                    <p className="text-[10px] line-clamp-1 font-mono tracking-tight">
                      {formatEventTime(event.start?.dateTime)} -{" "}
                      {formatEventTime(event.end?.dateTime)}
                    </p>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onSelect={() => setEventToDelete(event)}>
                  Delete Event
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{eventToDelete?.summary}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eventToDelete && handleDeleteEvent(eventToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CalendarEventComponent;
