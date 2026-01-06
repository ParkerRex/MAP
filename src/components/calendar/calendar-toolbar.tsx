"use client";

import { format, isSameDay, isSameMonth, isSameWeek, startOfWeek } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeatherWidget } from "@/components/weather-widget";

type ViewMode = "day" | "week" | "month";

interface CalendarToolbarProps {
  className?: string;
  selectedDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showWeekStrip: boolean;
  onToggleWeekStrip: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onJump: () => void;
  onOpenCalendars: () => void;
  onAddEvent: () => void;
  calendarPickerLabel: string;
  eventCount: number;
}

const CalendarToolbar = ({
  className,
  selectedDate,
  viewMode,
  onViewModeChange,
  showWeekStrip,
  onToggleWeekStrip,
  onPrev,
  onNext,
  onToday,
  onJump,
  onOpenCalendars,
  onAddEvent,
  calendarPickerLabel,
  eventCount,
}: CalendarToolbarProps) => {
  const isTodayDate = isSameDay(selectedDate, new Date());
  const dateLabel = format(selectedDate, "EEEE");
  const dateSubLabel = format(selectedDate, "MMMM d, yyyy");
  const monthLabel = format(selectedDate, "MMMM yyyy");

  const rangeLabel =
    viewMode === "week"
      ? format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")
      : monthLabel;

  const isCurrentRange =
    viewMode === "day"
      ? isTodayDate
      : viewMode === "week"
        ? isSameWeek(selectedDate, new Date(), { weekStartsOn: 1 })
        : isSameMonth(selectedDate, new Date());

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background/90 via-background/80 to-muted/40 px-4 py-3 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">{dateLabel}</h1>
            <p className="text-sm text-muted-foreground">{dateSubLabel}</p>
            <div className="mt-2 flex items-center gap-2">
              {!isTodayDate && (
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onToday}>
                  Today
                </Button>
              )}
              <span className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
                {eventCount} {eventCount === 1 ? "event" : "events"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <WeatherWidget />
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 w-full sm:w-auto"
              onClick={onOpenCalendars}
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                {calendarPickerLabel}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 w-full sm:w-auto"
              onClick={onToggleWeekStrip}
            >
              {showWeekStrip ? "Hide Week Strip" : "Show Week Strip"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 w-full sm:w-auto"
              onClick={onJump}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Jump
            </Button>
            <Button size="sm" className="w-full sm:w-auto" onClick={onAddEvent}>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-2 py-1 shadow-inner">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`px-3 text-xs ${isCurrentRange ? "text-muted-foreground" : ""}`}
              onClick={onToday}
              disabled={isCurrentRange}
            >
              <Sun className="mr-1 h-3 w-3" />
              {viewMode === "week" ? "This week" : "Today"}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground">{rangeLabel}</span>
          </div>

          <div className="flex items-center rounded-full border border-border/60 bg-muted/30 p-1 text-xs shadow-inner">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                  viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarToolbar;
