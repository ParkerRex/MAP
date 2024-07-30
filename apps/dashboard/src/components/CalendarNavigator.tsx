"use client";
import {
  formatForDisplay,
  safeParseDate,
  safeToISOString,
} from "@/app/calendar/utils/dateUtils";
import { Button } from "@map/ui/button";
import { Calendar } from "@map/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@map/ui/popover";
import { CalendarDaysIcon } from "lucide-react";
import type { DateTime } from "luxon";
import { useState } from "react";

export default function CalendarNavigator({
  currentDate,
}: {
  currentDate: string | Date;
}) {
  const handleDateChanged = (newDate: Date) => {
    const isoDate = safeToISOString(newDate);
    if (isoDate) {
      location.search = `currentDate=${isoDate}`;
    }
  };

  const [date, setDate] = useState<DateTime>(safeParseDate(new Date()));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="flex text-left justify-left font-normal text-slate-500 dark:text-gray-400  space-x-4 max-w-[300px]"
          variant="outline"
        >
          <CalendarDaysIcon className="ml-auto h-4 w-4 opacity-50" />
          <p>
            {date.isValid
              ? formatForDisplay(date.toJSDate(), "MMMM d, yyyy")
              : "Invalid Date"}
          </p>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          selected={safeParseDate(currentDate).toJSDate()}
          mode="single"
          onSelect={(newDate) => {
            if (newDate) {
              handleDateChanged(newDate);
              setDate(safeParseDate(newDate));
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
