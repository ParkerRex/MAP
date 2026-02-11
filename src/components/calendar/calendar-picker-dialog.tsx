"use client";

import type { calendar_v3 } from "googleapis";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CalendarPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  isCalendarSelected: (id: string) => boolean;
  onToggleCalendar: (id: string) => void;
}

export default function CalendarPickerDialog({
  open,
  onOpenChange,
  calendars,
  isCalendarSelected,
  onToggleCalendar,
}: CalendarPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Calendars</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {calendars.map((calendar) => {
            if (!calendar.id) return null;
            const selected = isCalendarSelected(calendar.id);
            return (
              <button
                key={calendar.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-muted/30"
                onClick={() => onToggleCalendar(calendar.id || "")}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: calendar.backgroundColor || "#3b82f6" }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{calendar.summary ?? "Calendar"}</div>
                  {calendar.primary && <div className="text-xs text-muted-foreground">Primary</div>}
                </div>
                {selected && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
        <div className="pt-2 text-right">
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
