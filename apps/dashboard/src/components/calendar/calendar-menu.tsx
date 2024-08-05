"use client";
import { useWeekNavigation } from "@/hooks/use-week-navigation";
import { useCalendar } from "@/store/calendar-context";
import { safeParseDate } from "@/utils/date-utils";
import { Calendar as UIDatePicker } from "@map/ui/calendar";
import { Separator } from "@map/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import { useCallback } from "react";

export default function CalendarMenu({
  className,
  ...props
}: {
  className?: string;
}) {
  const {
    visibleCalendars,
    toggleCalendarVisibility,
    calendars,
    currentWeekStartDate,
    setCurrentWeekStartDate,
    userTimeZone,
  } = useCalendar();
  const { handleSetWeek } = useWeekNavigation();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const parsedDate = safeParseDate(date);
      if (parsedDate) {
        const weekStartDate = parsedDate.startOf("week").setZone(userTimeZone);
        setCurrentWeekStartDate(weekStartDate.toJSDate());
        handleSetWeek(weekStartDate.toJSDate());
      }
    }
  };

  const handleToggleCalendar = useCallback(
    (calendarId: string) => {
      toggleCalendarVisibility(calendarId);
    },
    [toggleCalendarVisibility],
  );

  return (
    <section
      className={`h-screen flex flex-col w-[208px] dark:bg-[#1F1F1F] bg-[#F7F7F7] ${className}`}
      {...props}
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
                          onClick={() =>
                            handleToggleCalendar(calendar.id || "")
                          }
                        />
                      ) : (
                        <EyeOff
                          className="w-4 h-4 text-gray-500 cursor-pointer"
                          onClick={() =>
                            handleToggleCalendar(calendar.id || "")
                          }
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
