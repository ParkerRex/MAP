"use client";

import {
  formatForDisplay,
  safeParseDate,
} from "@/app/calendar/utils/dateUtils";
import { Button } from "@map/ui/button";
import { Calendar } from "@map/ui/calendar";
import { cn } from "@map/ui/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@map/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { DateTime } from "luxon";
import type * as React from "react";

interface DatePickerProps {
  selectedDate: Date | null | undefined;
  onDateChange: (date: Date | null | undefined) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const parsedDate = selectedDate ? DateTime.fromJSDate(selectedDate) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !parsedDate && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {parsedDate ? (
            formatForDisplay(parsedDate.toJSDate(), "MMMM d, yyyy")
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate?.toJSDate()}
          onSelect={(date) => onDateChange(date)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
