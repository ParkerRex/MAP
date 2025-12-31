"use client";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { addWeeks, format, getWeek, startOfWeek, subWeeks } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
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

  const currentMonth = format(currentWeekStartDate, "MMMM");
  const currentDay = format(currentWeekStartDate, "d");
  const currentYear = format(currentWeekStartDate, "yyyy");
  const currentWeek = `Week ${getWeek(currentWeekStartDate)}`;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:p-4 ${className}`}
    >
      <div className="flex items-baseline gap-1 sm:gap-2">
        <span className="text-xl font-semibold tracking-tight sm:text-3xl">{currentMonth}</span>
        <span className="text-xl font-semibold tracking-tight sm:text-3xl">{currentDay}</span>
        <span className="hidden text-lg tracking-tight sm:inline sm:text-2xl">{currentYear}</span>
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          {currentWeek}
        </span>
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
