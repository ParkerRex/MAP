"use client";

import { format } from "date-fns";
import type { calendar_v3 } from "googleapis";
import { ExternalLink, MapPin, Video } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useDeleteEvent } from "@/hooks/use-calendar";

interface EventDetailDialogProps {
  event: calendar_v3.Schema$Event | null;
  calendars: calendar_v3.Schema$CalendarListEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: calendar_v3.Schema$Event) => void;
}

const formatDate = (date: Date) => format(date, "EEEE, MMMM d, yyyy");
const formatTime = (date: Date) => format(date, "h:mm a");

function getCalendarColor(
  calendars: calendar_v3.Schema$CalendarListEntry[],
  calendarId: string | null | undefined,
) {
  const calendar = calendars.find((cal) => cal.id === calendarId);
  return calendar?.backgroundColor || "#3b82f6";
}

function getCalendarName(
  calendars: calendar_v3.Schema$CalendarListEntry[],
  calendarId: string | null | undefined,
) {
  const calendar = calendars.find((cal) => cal.id === calendarId);
  return calendar?.summary || "Calendar";
}

function getVideoLink(event: calendar_v3.Schema$Event) {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri
  );
}

function getUrlLabel(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default function EventDetailDialog({
  event,
  calendars,
  open,
  onOpenChange,
  onEdit,
}: EventDetailDialogProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteEvent = useDeleteEvent();

  const startDate = event?.start?.dateTime
    ? new Date(event.start.dateTime)
    : event?.start?.date
      ? new Date(event.start.date)
      : null;
  const endDate = event?.end?.dateTime
    ? new Date(event.end.dateTime)
    : event?.end?.date
      ? new Date(event.end.date)
      : null;

  const calendarColor = useMemo(
    () => (event ? getCalendarColor(calendars, event.organizer?.email) : "#3b82f6"),
    [event, calendars],
  );
  const calendarName = useMemo(
    () => (event ? getCalendarName(calendars, event.organizer?.email) : "Calendar"),
    [event, calendars],
  );

  if (!event) return null;

  const handleDelete = async () => {
    const calendarId = event.organizer?.email;
    if (!calendarId || !event.id) return;
    await deleteEvent.mutateAsync({ calendarId, eventId: event.id });
    setDeleteOpen(false);
    onOpenChange(false);
  };

  const videoLink = getVideoLink(event);
  const urlLink = event.htmlLink;

  return (
    <>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.summary}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{event.summary ?? "Untitled Event"}</DialogTitle>
            {startDate && (
              <DialogDescription>
                {formatDate(startDate)}
                {endDate && !event.start?.date && (
                  <> • {formatTime(startDate)}–{formatTime(endDate)}</>
                )}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/80 p-3 backdrop-blur-md">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Calendar</span>
                <span className="flex items-center gap-2 text-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: calendarColor }}
                  />
                  {calendarName}
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Color</span>
                <span className="text-foreground">
                  {event.colorId ? "Custom" : "None"}
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Alert</span>
                <span className="text-foreground">None</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Show As</span>
                <span className="rounded-full bg-muted/40 px-2 py-0.5 text-xs text-foreground">
                  {event.transparency === "transparent" ? "Free" : "Busy"}
                </span>
              </div>
            </div>

            {event.location && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm hover:bg-muted/30"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Location
                </span>
                <span className="flex items-center gap-1 text-foreground">
                  {event.location}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
            )}

            {videoLink && (
              <a
                href={videoLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm hover:bg-muted/30"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Video className="h-4 w-4" />
                  Join Video Call
                </span>
                <span className="flex items-center gap-1 text-foreground">
                  {event.conferenceData?.conferenceSolution?.name ?? "Google Meet"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
            )}

            {urlLink && (
              <a
                href={urlLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm hover:bg-muted/30"
              >
                <span className="flex items-center gap-2 text-muted-foreground">URL</span>
                <span className="flex items-center gap-1 text-foreground">
                  {getUrlLabel(urlLink)}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
            )}

            {event.description && (
              <div className="rounded-lg border border-border/60 bg-background/80 p-3 backdrop-blur-md">
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {event.attendees && event.attendees.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-background/80 p-3 backdrop-blur-md">
                <p className="text-sm font-medium text-muted-foreground">Attendees</p>
                <div className="mt-2 space-y-1 text-sm text-foreground/80">
                  {event.attendees.map((attendee) => (
                    <div key={attendee.email} className="flex items-center justify-between">
                      <span>{attendee.displayName ?? attendee.email}</span>
                      {attendee.responseStatus && (
                        <span className="text-xs text-muted-foreground">
                          {attendee.responseStatus}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete Event
            </Button>
            <Button onClick={() => onEdit(event)}>Edit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
