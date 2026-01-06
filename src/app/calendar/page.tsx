"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import CalendarDayTimeline from "@/components/calendar/calendar-day-timeline";
import ContextPanel from "@/components/calendar/calendar-context-panel";
import CalendarGrid from "@/components/calendar/calendar-grid";
import CalendarJumpDialog from "@/components/calendar/calendar-jump-dialog";
import CalendarMenu from "@/components/calendar/calendar-menu";
import CalendarMonthView from "@/components/calendar/calendar-month-view";
import CalendarPickerDialog from "@/components/calendar/calendar-picker-dialog";
import CalendarToolbar from "@/components/calendar/calendar-toolbar";
import CalendarWeekStrip from "@/components/calendar/calendar-week-strip";
import EventDetailDialog from "@/components/calendar/event-detail-dialog";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCalendarReconnect,
  useCalendars,
  useDeleteEvent,
  useGoogleStatus,
  useMultiCalendarEvents,
  useSyncCalendars,
} from "@/hooks/use-calendar";
import type { ExtendedEvent } from "@/types/calendar";

function ConnectGoogleCard() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <Calendar className="h-12 w-12 text-primary" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Connect Google Calendar</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Connect your Google Calendar to view and manage your events. Your calendars will sync
        automatically.
      </p>
      <Button asChild className="mt-6">
        <a href="/api/auth/google">Connect Google Calendar</a>
      </Button>
    </div>
  );
}

function ReconnectBanner({ onReconnect }: { onReconnect: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-amber-50 px-4 py-3 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          Your Google Calendar connection has expired. Please reconnect to continue syncing events.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onReconnect}
        className="flex-shrink-0 border-amber-300 bg-amber-100 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900 dark:hover:bg-amber-800"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Reconnect
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-4 w-48" />
      </div>
    </div>
  );
}

function CalendarPageContent() {
  const searchParams = useSearchParams();
  const { data: googleStatus, isLoading: isLoadingStatus, error: statusError } = useGoogleStatus();
  const syncMutation = useSyncCalendars();
  const { needsReconnect, checkForReconnect, reconnect, onReconnectSuccess } =
    useCalendarReconnect();

  // Check for calendar access revoked errors
  useEffect(() => {
    if (statusError) {
      checkForReconnect(statusError);
    }
  }, [statusError, checkForReconnect]);

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "connected") {
      // Auto-sync after successful connection
      onReconnectSuccess();
      syncMutation.mutate();
    }

    if (error) {
      console.error("Google connection error:", error);
    }
  }, [searchParams, syncMutation, onReconnectSuccess]);

  // Show loading state while checking connection status
  if (isLoadingStatus) {
    return <LoadingSkeleton />;
  }

  // Show connect card if not connected
  if (!googleStatus?.connected) {
    return <ConnectGoogleCard />;
  }

  return <CalendarDashboard needsReconnect={needsReconnect} onReconnect={reconnect} />;
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CalendarPageContent />
    </Suspense>
  );
}

interface CalendarDashboardProps {
  needsReconnect: boolean;
  onReconnect: () => void;
}

function CalendarDashboard({ needsReconnect, onReconnect }: CalendarDashboardProps) {
  // UI State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [showWeekStrip, setShowWeekStrip] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [eventFormStartDate, setEventFormStartDate] = useState<Date | null>(null);
  const [eventFormAllDay, setEventFormAllDay] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ExtendedEvent | null>(null);
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [navDirection, setNavDirection] = useState<"prev" | "next">("next");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<ExtendedEvent | null>(null);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set());
  const { checkForReconnect } = useCalendarReconnect();
  const deleteEvent = useDeleteEvent();

  // Server state - TanStack Query
  const { data: calendarsData, error: calendarsError } = useCalendars();
  const calendars = calendarsData?.calendars ?? [];

  // Check for calendar access revoked errors from calendar queries
  useEffect(() => {
    if (calendarsError) {
      checkForReconnect(calendarsError);
    }
  }, [calendarsError, checkForReconnect]);

  // Load stored calendar selection
  useEffect(() => {
    const stored = window.localStorage.getItem("map.calendar.selectedIds");
    if (stored) {
      try {
        const ids = JSON.parse(stored) as string[];
        setSelectedCalendarIds(new Set(ids));
      } catch {
        setSelectedCalendarIds(new Set());
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "map.calendar.selectedIds",
      JSON.stringify(Array.from(selectedCalendarIds)),
    );
  }, [selectedCalendarIds]);

  // Clean up removed calendars
  useEffect(() => {
    if (calendars.length === 0) return;
    setSelectedCalendarIds((prev) => {
      if (prev.size === 0) return prev;
      const valid = new Set(Array.from(prev).filter((id) => calendars.some((c) => c.id === id)));
      return valid;
    });
  }, [calendars]);

  const primaryCalendar = calendars.find((c) => c.primary) ?? calendars[0];

  const isCalendarSelected = (calendarId: string) => {
    if (selectedCalendarIds.size === 0) {
      return calendarId === primaryCalendar?.id;
    }
    return selectedCalendarIds.has(calendarId);
  };

  const toggleCalendarSelection = (calendarId: string) => {
    setSelectedCalendarIds((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return next;
    });
  };

  const activeCalendarIds = useMemo(() => {
    if (selectedCalendarIds.size === 0) {
      return primaryCalendar?.id ? new Set([primaryCalendar.id]) : new Set<string>();
    }
    return new Set(
      Array.from(selectedCalendarIds).filter((id) => calendars.some((cal) => cal.id === id)),
    );
  }, [selectedCalendarIds, calendars, primaryCalendar]);

  const activeCalendarList = useMemo(() => Array.from(activeCalendarIds), [activeCalendarIds]);

  const calendarPickerLabel = useMemo(() => {
    const selectedCount = selectedCalendarIds.size;
    if (selectedCount === 0) {
      return primaryCalendar?.summary ?? "Calendars";
    }
    if (selectedCount === 1) {
      const id = Array.from(selectedCalendarIds)[0];
      return calendars.find((cal) => cal.id === id)?.summary ?? "1 Calendar";
    }
    return `${selectedCount} Calendars`;
  }, [selectedCalendarIds, calendars, primaryCalendar]);

  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfMonth(selectedDate);
      const end = endOfDay(endOfMonth(selectedDate));
      return { start, end };
    }
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfDay(addDays(start, 6));
    return { start, end };
  }, [selectedDate, viewMode]);

  // Time range for events query
  const timeMin = useMemo(() => dateRange.start.toISOString(), [dateRange.start]);
  const timeMax = useMemo(() => dateRange.end.toISOString(), [dateRange.end]);

  const { data: events = [], error: eventsError } = useMultiCalendarEvents(
    activeCalendarList,
    timeMin,
    timeMax,
  );

  // Check for calendar access revoked errors from events queries
  useEffect(() => {
    if (eventsError) {
      checkForReconnect(eventsError);
    }
  }, [eventsError, checkForReconnect]);

  const visibleEvents = events.filter((event) =>
    activeCalendarIds.has(event.organizer?.email ?? ""),
  );

  const eventsForSelectedDay = visibleEvents.filter((event) => {
    const start = event.start?.dateTime || event.start?.date;
    return start ? new Date(start).toDateString() === selectedDate.toDateString() : false;
  });

  const openCreateEvent = (date?: Date, allDay = false) => {
    setEditingEvent(null);
    setEventFormStartDate(date ?? selectedDate);
    setEventFormAllDay(allDay);
    setEventFormOpen(true);
  };

  const handleEventClick = (event: ExtendedEvent) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  };

  const handleEventDeleteRequest = (event: ExtendedEvent) => {
    setEventToDelete(event);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    const calendarId = eventToDelete.organizer?.email;
    if (!calendarId || !eventToDelete.id) return;
    await deleteEvent.mutateAsync({ calendarId, eventId: eventToDelete.id });
    setDeleteOpen(false);
    setEventToDelete(null);
  };

  const handlePrev = () => {
    setNavDirection("prev");
    setSelectedDate((prev) => {
      if (viewMode === "month") return addMonths(prev, -1);
      if (viewMode === "week") return addWeeks(prev, -1);
      return addDays(prev, -1);
    });
  };

  const handleNext = () => {
    setNavDirection("next");
    setSelectedDate((prev) => {
      if (viewMode === "month") return addMonths(prev, 1);
      if (viewMode === "week") return addWeeks(prev, 1);
      return addDays(prev, 1);
    });
  };

  const currentWeekStartDate = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {needsReconnect && <ReconnectBanner onReconnect={onReconnect} />}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <CalendarMenu
          className="hidden flex-none lg:flex"
          calendars={calendars}
          isCalendarSelected={isCalendarSelected}
          toggleCalendarSelection={toggleCalendarSelection}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CalendarToolbar
            selectedDate={selectedDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showWeekStrip={showWeekStrip}
            onToggleWeekStrip={() => setShowWeekStrip((prev) => !prev)}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={() => setSelectedDate(new Date())}
            onJump={() => setJumpOpen(true)}
            onOpenCalendars={() => setCalendarPickerOpen(true)}
            onAddEvent={() => openCreateEvent()}
            calendarPickerLabel={calendarPickerLabel}
            eventCount={eventsForSelectedDay.length}
          />
          {showWeekStrip && (
            <div className="px-4 pt-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <CalendarWeekStrip
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setNavDirection(date > selectedDate ? "next" : "prev");
                  setSelectedDate(date);
                }}
                onDateDoubleClick={(date) => openCreateEvent(date)}
                events={visibleEvents}
                calendars={calendars}
              />
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-4">
            {viewMode === "day" &&
              (eventsForSelectedDay.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 text-center animate-in fade-in-0 duration-200">
                  <div className="rounded-full bg-muted/40 p-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {selectedDate.toDateString() === new Date().toDateString()
                        ? "Nothing scheduled today"
                        : "No events"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toDateString() === new Date().toDateString()
                        ? "Enjoy your free time or add something new"
                        : format(selectedDate, "EEEE, MMMM d")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={() => openCreateEvent()}>New Event</Button>
                    <Button variant="outline" onClick={() => openCreateEvent(selectedDate, true)}>
                      Add All-day
                    </Button>
                    <Button variant="ghost" onClick={() => setJumpOpen(true)}>
                      Jump to date
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={`day-${selectedDate.toDateString()}`}
                  className={`h-full animate-in fade-in-0 duration-200 ${
                    navDirection === "next" ? "slide-in-from-right-2" : "slide-in-from-left-2"
                  }`}
                >
                  <CalendarDayTimeline
                    selectedDate={selectedDate}
                    events={visibleEvents}
                    calendars={calendars}
                    onEventClick={handleEventClick}
                    onEventDelete={handleEventDeleteRequest}
                    onCreateEvent={() => openCreateEvent()}
                    onCreateEventAt={(date) => openCreateEvent(date)}
                    onCreateAllDay={() => openCreateEvent(selectedDate, true)}
                  />
                </div>
              ))}
            {viewMode === "week" && (
              <div
                key={`week-${currentWeekStartDate.toDateString()}`}
                className={`h-full animate-in fade-in-0 duration-200 ${
                  navDirection === "next" ? "slide-in-from-right-2" : "slide-in-from-left-2"
                }`}
              >
                <CalendarGrid
                  className="min-h-0 flex-1"
                  calendars={calendars}
                  events={visibleEvents}
                  currentWeekStartDate={currentWeekStartDate}
                  activeCalendarIds={activeCalendarIds}
                  onEventClick={handleEventClick}
                  onEventDelete={handleEventDeleteRequest}
                />
              </div>
            )}
            {viewMode === "month" && (
              <div
                key={`month-${selectedDate.toDateString()}`}
                className={`h-full animate-in fade-in-0 duration-200 ${
                  navDirection === "next" ? "slide-in-from-right-2" : "slide-in-from-left-2"
                }`}
              >
                <CalendarMonthView
                  selectedDate={selectedDate}
                  onSelectDate={(date) => {
                    setNavDirection(date > selectedDate ? "next" : "prev");
                    setSelectedDate(date);
                  }}
                  events={visibleEvents}
                  calendars={calendars}
                  onEventClick={handleEventClick}
                  onEventDelete={handleEventDeleteRequest}
                  onCreateEvent={() => openCreateEvent(selectedDate)}
                />
              </div>
            )}
          </div>
        </main>
        <ContextPanel
          className="hidden flex-none xl:flex"
          selectedEvent={selectedEvent}
          events={events}
          activeCalendarIds={activeCalendarIds}
          calendars={calendars}
          onClearSelection={() => setSelectedEvent(null)}
        />
      </div>

      <CalendarPickerDialog
        open={calendarPickerOpen}
        onOpenChange={setCalendarPickerOpen}
        calendars={calendars}
        isCalendarSelected={isCalendarSelected}
        onToggleCalendar={toggleCalendarSelection}
      />
      <CalendarJumpDialog
        open={jumpOpen}
        onOpenChange={setJumpOpen}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      <EventDetailDialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedEvent(null);
        }}
        event={selectedEvent}
        calendars={calendars}
        onEdit={(event) => {
          setDetailOpen(false);
          setEditingEvent(event);
          setEventFormStartDate(
            event.start?.dateTime
              ? new Date(event.start.dateTime)
              : event.start?.date
                ? new Date(event.start.date)
                : null,
          );
          setEventFormAllDay(!!event.start?.date);
          setEventFormOpen(true);
        }}
      />
      <EventFormDialog
        open={eventFormOpen}
        onOpenChange={(open) => {
          setEventFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
        calendars={calendars}
        selectedDate={selectedDate}
        initialStartDate={eventFormStartDate}
        initialIsAllDay={eventFormAllDay}
        editingEvent={editingEvent}
        onSuccess={() => setEditingEvent(null)}
      />
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setEventToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.summary}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
