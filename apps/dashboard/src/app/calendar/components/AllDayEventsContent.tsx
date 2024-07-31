import type { ExtendedEvent } from "@/types/calendar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@map/ui/context-menu";
import { DateTime, Interval } from "luxon";
import type { FC } from "react";
import { useCalendar } from "../contexts/CalendarContext";
import { formatForDisplay, safeParseDate } from "../utils/dateUtils";

interface AllDayEventsContentProps {
  events: ExtendedEvent[];
  daysOfWeek: Date[];
}

const AllDayEventsContent: FC<AllDayEventsContentProps> = ({
  events,
  daysOfWeek,
}) => {
  console.log("Events received in AllDayEventsContent:", events);
  const { setSelectedEvent, calendars, userTimeZone } = useCalendar();

  const handleEventClick = (event: ExtendedEvent) => {
    setSelectedEvent(event);
  };

  const getCalendarColor = (calendarId: string | null | undefined) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar?.backgroundColor || "#DDFFE3";
  };

  const isAllDayEvent = (event: ExtendedEvent) => {
    return event.start?.date !== undefined || event.all_day === true;
  };

  const validDaysOfWeek = daysOfWeek.filter(
    (day): day is Date => day instanceof Date,
  );

  const getEventSpan = (event: ExtendedEvent) => {
    const startDate = safeParseDate(
      event.start?.date || event.start?.dateTime || "",
    )?.setZone(userTimeZone);
    const endDate = safeParseDate(
      event.end?.date || event.end?.dateTime || "",
    )?.setZone(userTimeZone);

    if (!startDate || !endDate) return 0;

    return validDaysOfWeek.reduce((span, day) => {
      const dayDate = DateTime.fromJSDate(day).setZone(userTimeZone);
      return Interval.fromDateTimes(startDate, endDate).contains(dayDate)
        ? span + 1
        : span;
    }, 0);
  };

  return (
    <div className="flex border-b border-gray-200 min-h-[2rem]">
      <div className="w-16 flex-shrink-0" />
      <div className="flex-grow grid grid-cols-7">
        {validDaysOfWeek.map((day) => (
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
                      )?.setZone(userTimeZone) || DateTime.invalid,
                      "day",
                    ) ||
                    Interval.fromDateTimes(
                      safeParseDate(
                        event.start?.date || event.start?.dateTime || "",
                      )?.setZone(userTimeZone) || DateTime.invalid,
                      safeParseDate(
                        event.end?.date || event.end?.dateTime || "",
                      )?.setZone(userTimeZone) || DateTime.invalid,
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

export default AllDayEventsContent;
