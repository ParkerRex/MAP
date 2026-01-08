import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "../components/start/page";

const week = [
  { day: "Mon", focus: "Product sprint", blocks: 2 },
  { day: "Tue", focus: "AI infra", blocks: 3 },
  { day: "Wed", focus: "Integration day", blocks: 2 },
  { day: "Thu", focus: "Build + ship", blocks: 3 },
  { day: "Fri", focus: "Review + retro", blocks: 1 },
];

const upcoming = [
  { time: "10:00", title: "Google OAuth review", meta: "30m" },
  { time: "13:30", title: "Convex agents sync", meta: "45m" },
  { time: "16:00", title: "iOS check-in", meta: "20m" },
];

export const Route = createFileRoute("/calendar")({
  component: Calendar,
});

function Calendar() {
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
            <button type="button" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              Add event
            </button>
          </>
        }
      />

      <Panel title="Week rhythm" subtitle="Focus blocks per day">
        <div className="grid gap-4 md:grid-cols-5">
          {week.map((item) => (
            <div key={item.day} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.day}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{item.focus}</p>
              <Pill tone="emerald">{item.blocks} blocks</Pill>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Upcoming" subtitle="Next 6 hours" className="animate-rise-delay-1">
          <div className="space-y-4">
            {upcoming.map((event) => (
              <div key={event.title} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {event.time}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  </div>
                  <Pill tone="slate">{event.meta}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Sync status" subtitle="Google integration" className="animate-rise-delay-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Primary calendar</p>
              <p className="text-xs text-slate-500">Synced 2 minutes ago</p>
              <div className="mt-3 flex items-center gap-2">
                <Pill tone="emerald">Connected</Pill>
                <Pill tone="amber">Web OAuth</Pill>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-4 text-sm text-slate-500">
              Add secondary calendars after launch.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
