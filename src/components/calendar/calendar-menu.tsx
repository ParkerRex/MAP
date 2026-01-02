"use client";
import { startOfWeek } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { Eye, EyeOff } from "lucide-react";
import { Calendar as UIDatePicker } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

interface CalendarMenuProps {
  className?: string;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  visibleCalendars: Set<string>;
  toggleCalendarVisibility: (calendarId: string) => void;
  currentWeekStartDate: Date;
  setCurrentWeekStartDate: (date: Date) => void;
}

export default function CalendarMenu({
  className,
  calendars,
  visibleCalendars,
  toggleCalendarVisibility,
  currentWeekStartDate,
  setCurrentWeekStartDate,
}: CalendarMenuProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const weekStartDate = startOfWeek(date, { weekStartsOn: 1 });
      setCurrentWeekStartDate(weekStartDate);
    }
  };

  return (
    <section
      className={`flex h-full w-[208px] flex-col border-r bg-muted/30 dark:bg-muted/10 ${className}`}
    >
      <div className="flex flex-col items-center">
        <UIDatePicker
          className="w-full px-2"
          mode="single"
          selected={currentWeekStartDate}
          onSelect={handleDateSelect}
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",
            table: "w-full border-collapse",
            head_row: "flex justify-between",
            head_cell: "text-muted-foreground w-7 font-normal text-[0.7rem] text-center",
            row: "flex w-full justify-between mt-1",
            cell: "h-7 w-7 text-center text-xs p-0 relative",
            day: "h-7 w-7 p-0 font-normal text-xs hover:bg-accent rounded-md aria-selected:opacity-100",
          }}
        />
        <Separator className="bg-[#EBEBEB] dark:bg-[#242424] my-4" />

        <div className="p-4 flex flex-col w-full">
          {calendars.map(
            (calendar) =>
              calendar.id && (
                <div key={calendar.id} className="flex items-center mb-2">
                  <span className="flex items-center space-x-2 w-full">
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: calendar.backgroundColor || undefined,
                      }}
                    />
                    <span
                      className={`text-xs ${
                        visibleCalendars.has(calendar.id || "")
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {calendar.summary}
                    </span>
                    <span className="ml-auto">
                      {visibleCalendars.has(calendar.id || "") ? (
                        <Eye
                          className="w-4 h-4 text-gray-500 cursor-pointer"
                          onClick={() => toggleCalendarVisibility(calendar.id || "")}
                        />
                      ) : (
                        <EyeOff
                          className="w-4 h-4 text-gray-500 cursor-pointer"
                          onClick={() => toggleCalendarVisibility(calendar.id || "")}
                        />
                      )}
                    </span>
                  </span>
                </div>
              ),
          )}
        </div>
      </div>
    </section>
  );
}
