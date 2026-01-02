"use client";

import { Clock } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hour, minute] = value.split(":").map(Number);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const hourRef = React.useRef<HTMLDivElement>(null);
  const minuteRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        hourRef.current?.querySelector(`[data-hour="${hour}"]`)?.scrollIntoView({ block: "center" });
        minuteRef.current
          ?.querySelector(`[data-minute="${Math.floor(minute / 5) * 5}"]`)
          ?.scrollIntoView({ block: "center" });
      }, 0);
    }
  }, [open, hour, minute]);

  const handleHourSelect = (h: number) => {
    onChange(`${h.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
  };

  const handleMinuteSelect = (m: number) => {
    onChange(`${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatTime(value) : "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex h-[280px]">
          <div ref={hourRef} className="flex flex-col overflow-y-auto border-r scrollbar-thin">
            <div className="sticky top-0 bg-popover px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              Hour
            </div>
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                data-hour={h}
                onClick={() => handleHourSelect(h)}
                className={cn(
                  "px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                  hour === h && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {h.toString().padStart(2, "0")}
              </button>
            ))}
          </div>
          <div ref={minuteRef} className="flex flex-col overflow-y-auto scrollbar-thin">
            <div className="sticky top-0 bg-popover px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              Min
            </div>
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                data-minute={m}
                onClick={() => handleMinuteSelect(m)}
                className={cn(
                  "px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                  minute >= m && minute < m + 5 && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {m.toString().padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
