import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, startOfDay } from "date-fns";
import { useState } from "react";
import { PageHeader, Panel, Pill } from "../components/start/page";
import { apiRequest } from "../lib/client-api";

export const Route = createFileRoute("/calendar")({
  component: Calendar,
});

type CalendarEvent = {
  id: string;
  summary?: string | null;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
};

type CalendarInfo = {
  id: string;
  summary: string | null;
};

function Calendar() {
  const queryClient = useQueryClient();
  const rangeStart = startOfDay(new Date());
  const rangeEnd = addDays(rangeStart, 7);

  const eventsQuery = useQuery({
    queryKey: ["calendar", "events", rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: () =>
      apiRequest<{ events: CalendarEvent[] }>(
        `/api/calendar/events?calendarId=primary&timeMin=${encodeURIComponent(rangeStart.toISOString())}&timeMax=${encodeURIComponent(rangeEnd.toISOString())}`,
      ),
    refetchInterval: 30_000,
  });

  const calendarsQuery = useQuery({
    queryKey: ["calendar", "calendars"],
    queryFn: () => apiRequest<{ calendars: CalendarInfo[] }>("/api/calendar/calendars"),
    refetchInterval: 60_000,
  });

  const createEvent = useMutation({
    mutationFn: (payload: {
      summary: string;
      start: { dateTime?: string; date?: string; timeZone?: string };
      end: { dateTime?: string; date?: string; timeZone?: string };
    }) =>
      apiRequest<{ event: CalendarEvent }>("/api/calendar/events?calendarId=primary", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });

  const removeEvent = useMutation({
    mutationFn: (eventId: string) =>
      apiRequest<{ success: boolean }>(
        `/api/calendar/events/${encodeURIComponent(eventId)}?calendarId=primary`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });

  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);

  const events = eventsQuery.data?.events ?? [];
  const calendars = calendarsQuery.data?.calendars ?? [];

  const handleCreate = async () => {
    const trimmed = summary.trim();
    if (!trimmed || !startTime || !endTime) return;

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isAllDay) {
      const startDateOnly = startDate.toISOString().slice(0, 10);
      const rawEndDateOnly = endDate.toISOString().slice(0, 10);
      const normalizedEnd =
        rawEndDateOnly <= startDateOnly
          ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          : rawEndDateOnly;

      await createEvent.mutateAsync({
        summary: trimmed,
        start: { date: startDateOnly },
        end: { date: normalizedEnd },
      });
    } else {
      await createEvent.mutateAsync({
        summary: trimmed,
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
      });
    }

    setSummary("");
    setStartTime("");
    setEndTime("");
    setIsAllDay(false);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Rhythm lane"
        title="Calendar that follows the work"
        subtitle="Google Calendar sync, cached in Postgres."
        actions={
          <>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Week view
            </button>
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Add event
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="New event" subtitle="Add a focus block">
          <div className="space-y-3">
            <label
              htmlFor="new-event-title"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Title
            </label>
            <input
              id="new-event-title"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Design review"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Start
                </p>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  End
                </p>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(event) => setIsAllDay(event.target.checked)}
              />
              All day
            </label>
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Save event
            </button>
          </div>
        </Panel>
        <Panel title="Sync status" subtitle="Calendar sources" className="animate-rise-delay-1">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Google Calendar</p>
              <p className="text-xs text-slate-500">
                {calendarsQuery.isLoading
                  ? "Checking calendars..."
                  : `${calendars.length} calendar${calendars.length === 1 ? "" : "s"} linked`}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Pill tone={calendars.length > 0 ? "emerald" : "amber"}>
                  {calendars.length > 0 ? "Connected" : "Pending"}
                </Pill>
                <Pill tone="slate">Primary: {calendars[0]?.summary ?? "n/a"}</Pill>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-4 text-sm text-slate-500">
              Manual event adds route through Google API and persist locally for history + sync.
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Upcoming week" subtitle="Next 7 days" className="animate-rise-delay-2">
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
              No events yet. Add your first focus block above.
            </div>
          ) : (
            events.map((event) => {
              const startLabel = event.start?.dateTime
                ? format(new Date(event.start.dateTime), "EEE h:mm a")
                : event.start?.date
                  ? format(new Date(event.start.date), "EEE")
                  : "Unknown";

              const allDay = Boolean(event.start?.date && !event.start?.dateTime);

              return (
                <div
                  key={event.id}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {startLabel}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {event.summary ?? "Untitled"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone="slate">{allDay ? "All day" : "Scheduled"}</Pill>
                      <button
                        type="button"
                        onClick={() => void removeEvent.mutateAsync(event.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
}
