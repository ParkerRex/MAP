import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "../components/start/page";

const metrics = [
  { label: "Recovery", value: "78%", tone: "emerald" as const },
  { label: "Sleep", value: "6h 42m", tone: "amber" as const },
  { label: "Strain", value: "12.4", tone: "rose" as const },
];

const trend = [64, 72, 58, 79, 88, 74, 81];

export const Route = createFileRoute("/health")({
  component: Health,
});

function Health() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Recovery signal"
        title="Health snapshot"
        subtitle="Unified signals for recovery, sleep, and load."
        actions={
          <>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              WHOOP sync
            </button>
            <button type="button" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              Add metric
            </button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <Panel key={metric.label} title={metric.label} subtitle="Daily average">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
              <Pill tone={metric.tone}>Stable</Pill>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 rounded-full bg-slate-900" />
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="Weekly trend" subtitle="Recovery trendline" className="animate-rise-delay-1">
        <div className="grid grid-cols-7 items-end gap-3">
          {trend.map((value, index) => (
            <div key={`${value}-${index}`} className="flex flex-col items-center gap-2">
              <div className="h-24 w-full rounded-2xl bg-slate-100 p-2">
                <div
                  className="w-full rounded-xl bg-slate-900"
                  style={{ height: `${value}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{["M", "T", "W", "T", "F", "S", "S"][index]}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Insights" subtitle="AI surfaced patterns" className="animate-rise-delay-2">
        <div className="space-y-3">
          {[
            "Recovery rises when you end focus sessions by 4:30pm.",
            "Sleep debt accumulates on Tuesday/Wednesday launches.",
            "Two hydration reminders improved HRV by 4%.",
          ].map((insight) => (
            <div key={insight} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600">
              {insight}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
