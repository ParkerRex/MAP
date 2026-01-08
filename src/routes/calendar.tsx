import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { addDays, format, startOfDay } from "date-fns";
import { api } from "../../convex/_generated/api";
import { PageHeader, Panel, Pill } from "../components/start/page";

export const Route = createFileRoute("/calendar")({
  component: Calendar,
});

function Calendar() {
  const rangeStart = startOfDay(new Date());
  const rangeEnd = addDays(rangeStart, 7);

  const { data: events = [] } = useQuery({
    ...convexQuery(api.calendar.listEvents, {
      from: rangeStart.toISOString(),
      to: rangeEnd.toISOString(),
    }),
  });
  const { data: syncStatus } = useQuery({
    ...convexQuery(api.calendar.getSyncStatus, {}),
  });
  const createEvent = useMutation({
    mutationFn: useConvexMutation(api.calendar.createEvent),
  });
  const removeEvent = useMutation({
    mutationFn: useConvexMutation(api.calendar.removeEvent),
  });

  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);

  const handleCreate = async () => {
    const trimmed = summary.trim();
    if (!trimmed || !startTime || !endTime) return;
    await createEvent.mutateAsync({
      summary: trimmed,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      isAllDay,
    });
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
        subtitle="Real-time sync from Google, layered with focus blocks."
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
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Title</label>
            <input
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Design review"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Start</p>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">End</p>
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
              <p className="text-sm font-semibold text-slate-900">Local calendar</p>
              <p className="text-xs text-slate-500">
                {syncStatus?.lastSyncAt ? `Last sync ${new Date(syncStatus.lastSyncAt).toLocaleTimeString()}` : "No sync yet"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Pill tone="emerald">Connected</Pill>
                <Pill tone="amber">Web OAuth ready</Pill>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-4 text-sm text-slate-500">
              Google Calendar sync comes online after integration workflows.
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
            events.map((event) => (
              <div key={event._id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {format(new Date(event.startTime), "EEE h:mm a")}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{event.summary ?? "Untitled"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone="slate">{event.isAllDay ? "All day" : "Scheduled"}</Pill>
                    <button
                      type="button"
                      onClick={() => void removeEvent.mutateAsync({ eventId: event._id })}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
