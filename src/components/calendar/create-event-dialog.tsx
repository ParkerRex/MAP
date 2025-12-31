"use client";

import { format } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useCreateEvent } from "@/hooks/use-calendar";

interface CreateEventDialogProps {
  calendars: calendar_v3.Schema$CalendarListEntry[];
  currentWeekStartDate: Date;
}

export function CreateEventDialog({ calendars, currentWeekStartDate }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(currentWeekStartDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedCalendarId, setSelectedCalendarId] = useState("");

  const createEvent = useCreateEvent();
  const { toast } = useToast();

  const primaryCalendar = calendars.find((c) => c.primary) ?? calendars[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({ title: "Error", description: "Please enter an event title", variant: "destructive" });
      return;
    }

    const calendarId = selectedCalendarId || primaryCalendar?.id;
    if (!calendarId) {
      toast({ title: "Error", description: "No calendar selected", variant: "destructive" });
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    if (endDateTime <= startDateTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    const event: calendar_v3.Schema$Event = {
      summary: title,
      description: description || undefined,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    try {
      await createEvent.mutateAsync({ calendarId, event });
      toast({ title: "Success", description: "Event created" });
      setOpen(false);
      resetForm();
    } catch {
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(format(currentWeekStartDate, "yyyy-MM-dd"));
    setStartTime("09:00");
    setEndTime("10:00");
    setSelectedCalendarId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Add a new event to your calendar</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calendar">Calendar</Label>
              <select
                id="calendar"
                value={selectedCalendarId || primaryCalendar?.id || ""}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id || ""}>
                    {cal.summary} {cal.primary && "(Primary)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
