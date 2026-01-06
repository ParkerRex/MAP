"use client";

import { addMinutes, format, isSameDay, isToday } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface CalendarDayTimelineProps {
  selectedDate: Date;
  events: calendar_v3.Schema$Event[];
  calendars: calendar_v3.Schema$CalendarListEntry[];
  onEventClick: (event: calendar_v3.Schema$Event) => void;
  onEventDelete: (event: calendar_v3.Schema$Event) => void;
  onCreateEvent: () => void;
  onCreateEventAt: (date: Date) => void;
  onCreateAllDay: () => void;
}

const HOUR_HEIGHT = 60;
const TIMELINE_GAP = 6;

function isAllDayEvent(event: calendar_v3.Schema$Event) {
  return !!event.start?.date && !event.start?.dateTime;
}

function getCalendarColor(
  calendars: calendar_v3.Schema$CalendarListEntry[],
  calendarId: string | null | undefined,
) {
  const calendar = calendars.find((cal) => cal.id === calendarId);
  return calendar?.backgroundColor || "#3b82f6";
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

interface LayoutEvent {
  event: calendar_v3.Schema$Event;
  column: number;
  columns: number;
}

function buildLayout(events: calendar_v3.Schema$Event[]) {
  const sorted = [...events].sort((a, b) => {
    const aStart = new Date(a.start?.dateTime || a.start?.date || "").getTime();
    const bStart = new Date(b.start?.dateTime || b.start?.date || "").getTime();
    return aStart - bStart;
  });

  const clusters: calendar_v3.Schema$Event[][] = [];

  for (const event of sorted) {
    const eventStart = new Date(event.start?.dateTime || "").getTime();
    const eventEnd = new Date(event.end?.dateTime || "").getTime();
    let placed = false;

    for (const cluster of clusters) {
      const overlaps = cluster.some((existing) => {
        const start = new Date(existing.start?.dateTime || "").getTime();
        const end = new Date(existing.end?.dateTime || "").getTime();
        return eventStart < end && eventEnd > start;
      });

      if (overlaps) {
        cluster.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      clusters.push([event]);
    }
  }

  const layout: LayoutEvent[] = [];

  for (const cluster of clusters) {
    const columns: calendar_v3.Schema$Event[][] = [];
    for (const event of cluster) {
      const start = new Date(event.start?.dateTime || "").getTime();
      let assigned = false;
      for (let i = 0; i < columns.length; i++) {
        const last = columns[i][columns[i].length - 1];
        const lastEnd = new Date(last.end?.dateTime || "").getTime();
        if (start >= lastEnd) {
          columns[i].push(event);
          layout.push({ event, column: i, columns: 0 });
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        columns.push([event]);
        layout.push({ event, column: columns.length - 1, columns: 0 });
      }
    }
    for (const item of layout) {
      if (cluster.includes(item.event)) {
        item.columns = Math.max(item.columns, columns.length);
      }
    }
  }

  return layout;
}

export default function CalendarDayTimeline({
  selectedDate,
  events,
  calendars,
  onEventClick,
  onEventDelete,
  onCreateEvent,
  onCreateEventAt,
  onCreateAllDay,
}: CalendarDayTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollRequest, setScrollRequest] = useState(0);

  const dayEvents = useMemo(
    () =>
      events.filter((event) => {
        const start = event.start?.dateTime || event.start?.date;
        return start ? isSameDay(new Date(start), selectedDate) : false;
      }),
    [events, selectedDate],
  );

  const allDayEvents = dayEvents.filter(isAllDayEvent);
  const timedEvents = dayEvents.filter((event) => !isAllDayEvent(event));
  const layout = useMemo(() => buildLayout(timedEvents), [timedEvents]);

  const scrollToRelevant = () => {
    const container = containerRef.current;
    if (!container) return;
    const now = new Date();
    let targetHour = 8;

    if (isToday(selectedDate)) {
      targetHour = Math.max(0, now.getHours() - 1);
    } else if (timedEvents.length > 0) {
      const first = [...timedEvents].sort((a, b) => {
        const aStart = new Date(a.start?.dateTime || "").getTime();
        const bStart = new Date(b.start?.dateTime || "").getTime();
        return aStart - bStart;
      })[0];
      const start = new Date(first.start?.dateTime || "");
      if (!Number.isNaN(start.getTime())) {
        targetHour = Math.max(0, start.getHours() - 1);
      }
    }

    const scrollTop = targetHour * HOUR_HEIGHT - container.clientHeight / 3;
    container.scrollTop = Math.max(0, scrollTop);
  };

  useEffect(() => {
    scrollToRelevant();
  }, [selectedDate, scrollRequest]);

  const handleGridClick = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - bounds.top + event.currentTarget.scrollTop;
    const minutes = Math.max(0, (y / HOUR_HEIGHT) * 60);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    const start = addMinutes(date, roundedMinutes);
    onCreateEventAt(start);
  };

  const totalMinutes = timedEvents.reduce((sum, event) => {
    const start = new Date(event.start?.dateTime || "");
    const end = new Date(event.end?.dateTime || "");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return sum;
    return sum + Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  }, 0);

  const nextFree = useMemo(() => {
    if (timedEvents.length === 0) return null;
    const sorted = [...timedEvents].sort((a, b) => {
      const aStart = new Date(a.start?.dateTime || "").getTime();
      const bStart = new Date(b.start?.dateTime || "").getTime();
      return aStart - bStart;
    });
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const now = isToday(selectedDate) ? new Date() : startOfDay;
    let cursor = now;
    for (const event of sorted) {
      const start = new Date(event.start?.dateTime || "");
      const end = new Date(event.end?.dateTime || "");
      if (start > cursor) {
        const gap = Math.round((start.getTime() - cursor.getTime()) / 60000);
        if (gap >= 30) {
          return `Next free: ${format(cursor, "h:mm a")}`;
        }
      }
      if (end > cursor) cursor = end;
    }
    return null;
  }, [timedEvents, selectedDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalExtra = totalMinutes % 60;
  const scheduledLabel =
    totalMinutes === 0
      ? "Tap the grid to add a time"
      : totalHours > 0
        ? `${totalHours}h ${totalExtra}m scheduled`
        : `${totalMinutes}m scheduled`;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            All Day
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px]">
              {allDayEvents.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allDayEvents.map((event) => {
              const color = getCalendarColor(calendars, event.organizer?.email);
              const rgb = hexToRgb(color);
              const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)` : `${color}1f`;
              return (
                <ContextMenu key={event.id}>
                  <ContextMenuTrigger>
                    <button
                      type="button"
                      onClick={() => onEventClick(event)}
                      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                      style={{ backgroundColor: bgColor }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      {event.summary ?? "Untitled"}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={() => onEventDelete(event)} className="text-destructive">
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
            <button
              type="button"
              onClick={onCreateAllDay}
              className="rounded-full border border-dashed border-border/70 px-3 py-1.5 text-sm text-muted-foreground"
            >
              + Add all-day
            </button>
          </div>
        </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Timeline</p>
          <p className="text-xs text-muted-foreground">{scheduledLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {nextFree && (
            <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
              {nextFree}
            </span>
          )}
          <button
            type="button"
            onClick={() => setScrollRequest((prev) => prev + 1)}
            className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-foreground hover:bg-muted/40"
          >
            {isToday(selectedDate) ? "Now" : "Focus"}
          </button>
          <button
            type="button"
            onClick={onCreateEvent}
            className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow-sm"
          >
            New Event
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-sm backdrop-blur-md">
        <div className="w-[56px] shrink-0 border-r border-border/40 bg-muted/20">
          {hours.map((hour) => (
            <div
              key={hour}
              className="relative h-[60px] pr-2 text-right text-[11px] text-muted-foreground"
            >
              <span className="absolute -top-2 right-2">{format(new Date().setHours(hour, 0), "h a")}</span>
            </div>
          ))}
        </div>
        <div className="relative flex-1 overflow-y-auto" ref={containerRef} onClick={handleGridClick}>
          <div className="relative h-[1440px]">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-t border-border/40"
                style={{ backgroundColor: hour % 2 === 0 ? "rgba(0,0,0,0.02)" : "transparent" }}
              />
            ))}

            {isToday(selectedDate) && (
              <div
                className="absolute left-0 right-0 z-10 flex items-center"
                style={{
                  top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * (HOUR_HEIGHT / 60)}px`,
                }}
              >
                <div className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  NOW
                </div>
                <div className="ml-2 h-2 w-2 rounded-full bg-primary" />
                <div className="ml-2 h-px flex-1 bg-primary" />
              </div>
            )}

            {layout.map(({ event, column, columns }) => {
              const start = new Date(event.start?.dateTime || "");
              const end = new Date(event.end?.dateTime || "");
              if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
              const top = ((start.getHours() * 60 + start.getMinutes()) / 60) * HOUR_HEIGHT;
              const height = Math.max(((end.getTime() - start.getTime()) / 3600000) * HOUR_HEIGHT, 28);
              const width = `calc(${100 / columns}% - ${TIMELINE_GAP}px)`;
              const left = `calc(${(100 / columns) * column}% + ${TIMELINE_GAP / 2}px)`;
              const color = getCalendarColor(calendars, event.organizer?.email);
              const rgb = hexToRgb(color);
              const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : `${color}26`;
              const gradient = rgb
                ? `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) 100%)`
                : undefined;

              return (
                <ContextMenu key={event.id}>
                  <ContextMenuTrigger>
                    <div
                      className="absolute cursor-pointer rounded-md border border-border/40 px-2 py-1 text-xs shadow-sm transition hover:shadow-md"
                      style={{
                        top,
                        left,
                        width,
                        height,
                        backgroundColor: bgColor,
                        backgroundImage: gradient,
                        borderLeft: `3px solid ${color}`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="font-semibold line-clamp-2">{event.summary ?? "Untitled"}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(start, "h:mm a")} - {format(end, "h:mm a")}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={() => onEventDelete(event)} className="text-destructive">
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
