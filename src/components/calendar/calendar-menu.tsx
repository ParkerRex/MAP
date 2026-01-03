"use client";
import { startOfWeek } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { Check } from "lucide-react";
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
    <aside
      className={`flex h-full w-[220px] flex-col border-r border-border/50 bg-background ${className}`}
    >
      <div className="flex flex-col">
        <UIDatePicker
          className="w-full px-2 pt-2"
          mode="single"
          selected={currentWeekStartDate}
          onSelect={handleDateSelect}
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",
            table: "w-full border-collapse",
            head_row: "flex justify-between",
            head_cell: "text-muted-foreground w-7 font-medium text-[0.65rem] text-center uppercase",
            row: "flex w-full justify-between mt-1",
            cell: "h-7 w-7 text-center text-xs p-0 relative",
            day: "h-7 w-7 p-0 font-normal text-xs hover:bg-accent rounded-md aria-selected:opacity-100 transition-colors",
          }}
        />

        <Separator className="my-3 mx-3" />

        <div className="px-3 pb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            My Calendars
          </p>
          <div className="space-y-0.5">
            {calendars.map(
              (calendar) =>
                calendar.id && (
                  <button
                    key={calendar.id}
                    type="button"
                    className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-left transition-colors hover:bg-muted/50 ${
                      visibleCalendars.has(calendar.id || "")
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => toggleCalendarVisibility(calendar.id || "")}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        visibleCalendars.has(calendar.id || "")
                          ? "border-transparent"
                          : "border-muted-foreground/30"
                      }`}
                      style={{
                        backgroundColor: visibleCalendars.has(calendar.id || "")
                          ? calendar.backgroundColor || "#3b82f6"
                          : "transparent",
                      }}
                    >
                      {visibleCalendars.has(calendar.id || "") && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm truncate flex-1">{calendar.summary}</span>
                  </button>
                ),
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
