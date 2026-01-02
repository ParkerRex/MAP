"use client";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { addWeeks, format, startOfWeek, subWeeks } from "date-fns";
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

  const dateDisplay = format(currentWeekStartDate, "MMMM yyyy");

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight sm:text-xl">{dateDisplay}</span>
        <WeatherWidget />
      </div>
      <div className="flex items-center gap-1">
        {calendars.length > 0 && (
          <CreateEventDialog calendars={calendars} currentWeekStartDate={currentWeekStartDate} />
        )}
        <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
          Today
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Previous week</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Next week</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default React.memo(CalendarToolbar);
