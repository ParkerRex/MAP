"use client";

import { startOfWeek } from "date-fns";
import { Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import ContextPanel from "@/components/calendar/calendar-context-panel";
import CalendarGrid from "@/components/calendar/calendar-grid";
import CalendarMenu from "@/components/calendar/calendar-menu";
import CalendarToolbar from "@/components/calendar/calendar-toolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
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
        <a href="/api/google/auth">Connect Google Calendar</a>
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
  const { data: googleStatus, isLoading: isLoadingStatus } = useGoogleStatus();
  const syncMutation = useSyncCalendars();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "connected") {
      // Auto-sync after successful connection
      syncMutation.mutate();
    }

    if (error) {
      console.error("Google connection error:", error);
    }
  }, [searchParams, syncMutation]);

  // Show loading state while checking connection status
  if (isLoadingStatus) {
    return <LoadingSkeleton />;
  }

  // Show connect card if not connected
  if (!googleStatus?.connected) {
    return <ConnectGoogleCard />;
  }

  return <CalendarDashboard />;
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CalendarPageContent />
    </Suspense>
  );
}

function CalendarDashboard() {
  // UI State - just React useState
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
  const [visibleCalendars, setVisibleCalendars] = useState<Set<string>>(new Set());

  // Server state - TanStack Query
  const { data: calendarsData } = useCalendars();
  const calendars = calendarsData?.calendars ?? [];

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

  const { data: events = [] } = useMultiCalendarEvents(visibleCalendarIds, timeMin, timeMax);

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
    <div className="flex h-screen w-screen overflow-hidden">
      <CalendarMenu
        className="flex-none w-64"
        calendars={calendars}
        visibleCalendars={visibleCalendars}
        toggleCalendarVisibility={toggleCalendarVisibility}
        currentWeekStartDate={currentWeekStartDate}
        setCurrentWeekStartDate={setCurrentWeekStartDate}
      />
      <main className="flex flex-col grow overflow-hidden">
        <CalendarToolbar
          currentWeekStartDate={currentWeekStartDate}
          setCurrentWeekStartDate={setCurrentWeekStartDate}
        />
        <CalendarGrid
          className="grow overflow-hidden"
          calendars={calendars}
          events={visibleEvents}
          currentWeekStartDate={currentWeekStartDate}
          visibleCalendars={visibleCalendars}
          setSelectedEvent={setSelectedEvent}
        />
      </main>
      <ContextPanel
        className="flex-none w-64"
        selectedEvent={selectedEvent}
        events={events}
        visibleCalendars={visibleCalendars}
        calendars={calendars}
      />
    </div>
  );
}
