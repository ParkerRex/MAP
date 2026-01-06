"use client";

import { addDays, addHours, addMinutes, format } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/components/ui/use-toast";
import { useCreateEvent, useUpdateEvent } from "@/hooks/use-calendar";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  selectedDate: Date;
  initialStartDate?: Date | null;
  initialIsAllDay?: boolean;
  editingEvent?: calendar_v3.Schema$Event | null;
  onSuccess?: () => void;
}

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toTimeInputValue(date: Date) {
  return format(date, "HH:mm");
}

function parseDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`);
}

function isAllDayEvent(event: calendar_v3.Schema$Event | null | undefined) {
  return !!event?.start?.date && !event?.start?.dateTime;
}

export function EventFormDialog({
  open,
  onOpenChange,
  calendars,
  selectedDate,
  initialStartDate,
  initialIsAllDay = false,
  editingEvent,
  onSuccess,
}: EventFormDialogProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();

  const primaryCalendar = useMemo(
    () => calendars.find((c) => c.primary) ?? calendars[0],
    [calendars],
  );

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(toDateInputValue(selectedDate));
  const [endDate, setEndDate] = useState(toDateInputValue(addDays(selectedDate, 1)));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [addVideoConference, setAddVideoConference] = useState(false);

  const isEditing = !!editingEvent;

  useEffect(() => {
    if (!open) return;

    const event = editingEvent ?? null;
    const allDay = isAllDayEvent(event) || initialIsAllDay;
    const startDate =
      (event?.start?.dateTime && new Date(event.start.dateTime)) ||
      (event?.start?.date && new Date(event.start.date)) ||
      initialStartDate ||
      addHours(selectedDate, 1);
    const eventEndDate =
      (event?.end?.dateTime && new Date(event.end.dateTime)) ||
      (event?.end?.date && new Date(event.end.date)) ||
      addHours(startDate, 1);

    setTitle(event?.summary ?? "");
    setLocation(event?.location ?? "");
    setNotes(event?.description ?? "");
    if (allDay) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = event?.end?.date
        ? new Date(event.end.date)
        : addDays(startOfDay, 1);
      setDate(toDateInputValue(startOfDay));
      setEndDate(toDateInputValue(endOfDay));
      setStartTime("09:00");
      setEndTime("10:00");
    } else {
      setDate(toDateInputValue(startDate));
      setStartTime(toTimeInputValue(startDate));
      setEndTime(toTimeInputValue(eventEndDate));
      setEndDate(toDateInputValue(eventEndDate));
    }
    setSelectedCalendarId(event?.organizer?.email ?? primaryCalendar?.id ?? "");
    setIsAllDay(allDay);
    setAddVideoConference(false);
  }, [open, editingEvent, initialIsAllDay, initialStartDate, primaryCalendar, selectedDate]);

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

    let eventPayload: calendar_v3.Schema$Event;
    if (isAllDay) {
      const startDateValue = new Date(`${date}T00:00:00`);
      let endDateValue = new Date(`${endDate}T00:00:00`);
      if (endDateValue <= startDateValue) {
        endDateValue = addDays(startDateValue, 1);
      }
      eventPayload = {
        summary: title,
        location: location || undefined,
        description: notes || undefined,
        start: { date: toDateInputValue(startDateValue) },
        end: { date: toDateInputValue(endDateValue) },
      };
    } else {
      const startDateTime = parseDateTime(date, startTime);
      const endDateTime = parseDateTime(date, endTime);

      if (endDateTime <= startDateTime) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }

      eventPayload = {
        summary: title,
        location: location || undefined,
        description: notes || undefined,
        start: { dateTime: startDateTime.toISOString(), timeZone },
        end: { dateTime: endDateTime.toISOString(), timeZone },
      };
    }

    if (!isEditing && addVideoConference) {
      eventPayload = {
        ...eventPayload,
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      };
    }

    try {
      if (isEditing && editingEvent?.id) {
        await updateEvent.mutateAsync({
          calendarId,
          eventId: editingEvent.id,
          event: eventPayload,
        });
        toast({ title: "Saved", description: "Event updated" });
      } else {
        await createEvent.mutateAsync({ calendarId, event: eventPayload });
        toast({ title: "Created", description: "Event added" });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        title: "Error",
        description: isEditing ? "Failed to update event" : "Failed to create event",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update event details" : "Add a new event to your calendar"}
            </DialogDescription>
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Optional location"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calendar">Calendar</Label>
              <select
                id="calendar"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedCalendarId || primaryCalendar?.id || ""}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id || ""}>
                    {cal.summary} {cal.primary ? "(Primary)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <Label htmlFor="all-day" className="text-sm">
                All day
              </Label>
              <Switch id="all-day" checked={isAllDay} onCheckedChange={setIsAllDay} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            {isAllDay ? (
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Time</Label>
                  <TimePicker value={startTime} onChange={setStartTime} />
                </div>
                <div className="grid gap-2">
                  <Label>End Time</Label>
                  <TimePicker value={endTime} onChange={setEndTime} />
                </div>
              </div>
            )}
            {!isEditing && (
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <Label htmlFor="video" className="text-sm">
                  Add Google Meet
                </Label>
                <Switch
                  id="video"
                  checked={addVideoConference}
                  onCheckedChange={setAddVideoConference}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
              {isEditing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
