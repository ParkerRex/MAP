"use client";
import { Button } from "@map/ui/button";
import { Tooltip, TooltipContent } from "@map/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import type { calendar_v3 } from "googleapis";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import * as React from "react";
import { useCalendar } from "../contexts/CalendarContext";
import { useWeekNavigation } from "../hooks/useWeekNavigation";
import { formatForDisplay, safeParseDate } from "../utils/dateUtils";

interface CalendarToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  calendars: calendar_v3.Schema$CalendarListEntry[];
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  calendars = [],
  className,
  ...props
}) => {
  const { currentWeekStartDate, userTimeZone } = useCalendar();
  const { handleNextWeek, handleCurrentWeek, handlePreviousWeek } =
    useWeekNavigation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const currentDate =
    safeParseDate(currentWeekStartDate)?.setZone(userTimeZone);

  if (!currentDate) {
    return null; // Or some error handling
  }

  const currentMonth = formatForDisplay(currentDate.toJSDate(), "MMMM");
  const currentDay = formatForDisplay(currentDate.toJSDate(), "d");
  const currentYear = formatForDisplay(currentDate.toJSDate(), "yyyy");
  const currentWeek = `Week ${currentDate.weekNumber}`;

  return (
    <div
      className={`flex items-center justify-between space-x-2 p-4 border-b border-[#f0f0f0] dark:border-[#2b2b2b] ${className}`}
      {...props}
    >
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-semibold tracking-tighter -mr-1">
          {currentMonth}
        </span>
        <span className="text-3xl font-semibold tracking-tighter">
          {currentDay}
        </span>
        <span className="text-2xl tracking-tighter">{currentYear}</span>
        <span className="text-xs tracking-tighter font-mono text-gray-500">
          {currentWeek}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={handleCurrentWeek}>
          Today
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" onClick={handlePreviousWeek}>
              <ChevronLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Previous week</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" onClick={handleNextWeek}>
              <ChevronRight />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Next week</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default React.memo(CalendarToolbar);
