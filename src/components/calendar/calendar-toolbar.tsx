"use client";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { addWeeks, format, getWeek, startOfWeek, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";

interface CalendarToolbarProps {
  className?: string;
  currentWeekStartDate: Date;
  setCurrentWeekStartDate: (date: Date) => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  className,
  currentWeekStartDate,
  setCurrentWeekStartDate,
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
      className={`flex items-center justify-between space-x-2 p-4 border-b border-[#f0f0f0] dark:border-[#2b2b2b] ${className}`}
    >
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-semibold tracking-tighter -mr-1">{currentMonth}</span>
        <span className="text-3xl font-semibold tracking-tighter">{currentDay}</span>
        <span className="text-2xl tracking-tighter">{currentYear}</span>
        <span className="text-xs tracking-tighter font-mono text-gray-500">{currentWeek}</span>
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
