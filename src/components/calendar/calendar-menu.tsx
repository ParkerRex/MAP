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
      className={`h-screen flex flex-col w-[208px] dark:bg-[#1F1F1F] bg-[#F7F7F7] ${className}`}
    >
      <div className="flex flex-col items-center">
        <UIDatePicker
          className="w-[190px] justify-center"
          mode="single"
          selected={currentWeekStartDate}
          onSelect={handleDateSelect}
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
