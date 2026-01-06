"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CalendarJumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function CalendarJumpDialog({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
}: CalendarJumpDialogProps) {
  const value = format(selectedDate, "yyyy-MM-dd");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Jump to date</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="date"
            value={value}
            onChange={(e) => onSelectDate(new Date(`${e.target.value}T00:00:00`))}
          />
          <div className="text-right">
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
