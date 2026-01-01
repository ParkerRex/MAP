"use client";

import { startOfWeek } from "date-fns";
import { AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import ContextPanel from "@/components/calendar/calendar-context-panel";
import CalendarGrid from "@/components/calendar/calendar-grid";
import CalendarMenu from "@/components/calendar/calendar-menu";
import CalendarToolbar from "@/components/calendar/calendar-toolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isCalendarAccessRevokedError,
  useCalendarReconnect,
  useCalendars,
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
  // UI State - just React useState
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
  const [visibleCalendars, setVisibleCalendars] = useState<Set<string>>(new Set());
  const { checkForReconnect } = useCalendarReconnect();

  // Server state - TanStack Query
  const { data: calendarsData, error: calendarsError } = useCalendars();
  const calendars = calendarsData?.calendars ?? [];

  // Check for calendar access revoked errors from calendar queries
  useEffect(() => {
    if (calendarsError) {
      checkForReconnect(calendarsError);
    }
  }, [calendarsError, checkForReconnect]);

  // Initialize visible calendars when loaded
  useEffect(() => {
    if (calendars.length > 0 && visibleCalendars.size === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time initialization from server data
      setVisibleCalendars(new Set(calendars.map((c) => c.id).filter(Boolean) as string[]));
    }
  }, [calendars, visibleCalendars.size]);

  // Time range for events query
  const timeMin = useMemo(() => currentWeekStartDate.toISOString(), [currentWeekStartDate]);
  const timeMax = useMemo(
    () => new Date(currentWeekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    [currentWeekStartDate],
  );

  const visibleCalendarIds = useMemo(
    () => Array.from(visibleCalendars).filter((id) => calendars.some((cal) => cal.id === id)),
    [visibleCalendars, calendars],
  );

  const { data: events = [], error: eventsError } = useMultiCalendarEvents(
    visibleCalendarIds,
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
    visibleCalendars.has(event.organizer?.email ?? ""),
  );

  const toggleCalendarVisibility = (calendarId: string) => {
    setVisibleCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {needsReconnect && <ReconnectBanner onReconnect={onReconnect} />}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <CalendarMenu
          className="hidden flex-none lg:flex"
          calendars={calendars}
          visibleCalendars={visibleCalendars}
          toggleCalendarVisibility={toggleCalendarVisibility}
          currentWeekStartDate={currentWeekStartDate}
          setCurrentWeekStartDate={setCurrentWeekStartDate}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CalendarToolbar
            currentWeekStartDate={currentWeekStartDate}
            setCurrentWeekStartDate={setCurrentWeekStartDate}
            calendars={calendars}
          />
          <CalendarGrid
            className="min-h-0 flex-1"
            calendars={calendars}
            events={visibleEvents}
            currentWeekStartDate={currentWeekStartDate}
            visibleCalendars={visibleCalendars}
            setSelectedEvent={setSelectedEvent}
          />
        </main>
        <ContextPanel
          className="hidden flex-none xl:flex"
          selectedEvent={selectedEvent}
          events={events}
          visibleCalendars={visibleCalendars}
          calendars={calendars}
        />
      </div>
    </div>
  );
}
