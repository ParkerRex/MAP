"use client";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { addWeeks, format, isSameWeek, startOfWeek, subWeeks } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { WeatherWidget } from "@/components/weather-widget";
import { CreateEventDialog } from "./create-event-dialog";

interface CalendarToolbarProps {
  className?: string;
  currentWeekStartDate: Date;
  setCurrentWeekStartDate: (date: Date) => void;
  calendars?: calendar_v3.Schema$CalendarListEntry[];
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  className,
  currentWeekStartDate,
  setCurrentWeekStartDate,
  calendars = [],
}) => {
  const handleNextWeek = () => {
    const newDate = addWeeks(currentWeekStartDate, 1);
    setCurrentWeekStartDate(startOfWeek(newDate, { weekStartsOn: 1 }));
  };

  const handlePreviousWeek = () => {
    const newDate = subWeeks(currentWeekStartDate, 1);
    setCurrentWeekStartDate(startOfWeek(newDate, { weekStartsOn: 1 }));
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isCurrentWeek = isSameWeek(currentWeekStartDate, new Date(), { weekStartsOn: 1 });
  const dateDisplay = format(currentWeekStartDate, "MMMM yyyy");

  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-border/50 bg-background px-4 py-3 ${className}`}
    >
      {/* Left side - Date and navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border/50 bg-muted/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-l-lg rounded-r-none"
                onClick={handlePreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous week</TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 rounded-none px-3 text-sm font-medium ${
              isCurrentWeek
                ? "text-muted-foreground cursor-default hover:bg-transparent"
                : "hover:text-foreground"
            }`}
            onClick={handleCurrentWeek}
            disabled={isCurrentWeek}
          >
            Today
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-r-lg rounded-l-none"
                onClick={handleNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next week</TooltipContent>
          </Tooltip>
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{dateDisplay}</h1>
      </div>

      {/* Right side - Weather and actions */}
      <div className="flex items-center gap-3">
        <WeatherWidget />
        {calendars.length > 0 && (
          <CreateEventDialog calendars={calendars} currentWeekStartDate={currentWeekStartDate} />
        )}
      </div>
    </div>
  );
};

export default React.memo(CalendarToolbar);
