import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@map/ui/context-menu";
import type { calendar_v3 } from "googleapis";
import { DateTime, Interval } from "luxon";
import type { FC } from "react";
import { useCalendar } from "../contexts/CalendarContext";
import { formatForDisplay, safeParseDate } from "../utils/dateUtils";

interface CalendarAllDayEventsProps {
  events: calendar_v3.Schema$Event[];
  daysOfWeek: Date[];
}

const CalendarAllDayEvents: FC<CalendarAllDayEventsProps> = ({
  events,
  daysOfWeek,
}) => {
  const { setSelectedEvent, calendars, userTimeZone } = useCalendar();

  const handleEventClick = (event: calendar_v3.Schema$Event) => {
    setSelectedEvent(event);
  };

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#DDFFE3";
  };

  const isAllDayEvent = (event: calendar_v3.Schema$Event) => {
    if (event.start?.date) return true;

    const startDate = safeParseDate(event.start?.dateTime || "", userTimeZone);
    const endDate = safeParseDate(event.end?.dateTime || "", userTimeZone);

    if (!startDate.isValid || !endDate.isValid) return false;

    return endDate.diff(startDate, "hours").hours >= 24;
  };

  const getEventSpan = (event: calendar_v3.Schema$Event) => {
    const startDate = safeParseDate(
      event.start?.date || event.start?.dateTime || "",
      userTimeZone,
    );
    const endDate = safeParseDate(
      event.end?.date || event.end?.dateTime || "",
      userTimeZone,
    );

    if (!startDate.isValid || !endDate.isValid) return 0;

    let span = 0;
    for (let i = 0; i < daysOfWeek.length; i++) {
      const dayDate = DateTime.fromJSDate(daysOfWeek[i]).setZone(userTimeZone);
      if (Interval.fromDateTimes(startDate, endDate).contains(dayDate)) {
        span++;
      }
    }
    return span;
  };

  return (
    <div className="flex border-b border-gray-200 min-h-[2rem]">
      <div className="w-16 flex-shrink-0" />
      <div className="flex-grow grid grid-cols-7">
        {daysOfWeek.map((day) => (
          <div key={day.toString()} className="border-r border-gray-200 p-1">
            {events
              .filter(
                (event) =>
                  isAllDayEvent(event) &&
                  (DateTime.fromJSDate(day)
                    .setZone(userTimeZone)
                    .hasSame(
                      safeParseDate(
                        event.start?.date || event.start?.dateTime || "",
                        userTimeZone,
                      ),
                      "day",
                    ) ||
                    Interval.fromDateTimes(
                      safeParseDate(
                        event.start?.date || event.start?.dateTime || "",
                        userTimeZone,
                      ),
                      safeParseDate(
                        event.end?.date || event.end?.dateTime || "",
                        userTimeZone,
                      ),
                    ).contains(DateTime.fromJSDate(day).setZone(userTimeZone))),
              )
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
  );
};

export default CalendarAllDayEvents;
