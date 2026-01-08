import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "../components/start/page";

const todayTasks = [
  { title: "Ship auth + layout commits", project: "Migration", status: "In progress" },
  { title: "Define chat thread schema", project: "AI", status: "Queued" },
  { title: "Plan iOS OAuth flow", project: "iOS", status: "Blocked" },
];

const lanes = [
  { label: "Deep work", count: 3, tone: "emerald" as const },
  { label: "Quick hits", count: 5, tone: "amber" as const },
  { label: "Delegated", count: 2, tone: "slate" as const },
];

export const Route = createFileRoute("/tasks")({
  component: Tasks,
});

function Tasks() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Execution lane"
        title="Tasks that move the needle"
        subtitle="Live data from Convex keeps everyone aligned and in sync."
        actions={
          <>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Filter stacks
            </button>
            <button type="button" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              New task
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Today" subtitle="Protected tasks for your focus blocks">
          <div className="space-y-4">
            {todayTasks.map((task) => (
              <div key={task.title} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.project}</p>
                  </div>
                  <Pill tone="emerald">{task.status}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Focus lanes" subtitle="Balance deep work with quick hits" className="animate-rise-delay-1">
          <div className="space-y-4">
            {lanes.map((lane) => (
              <div key={lane.label} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{lane.label}</p>
                    <p className="text-xs text-slate-500">Auto-sorted by priority</p>
                  </div>
                  <Pill tone={lane.tone}>{lane.count} items</Pill>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Backlog" subtitle="Ready to pull when focus opens up" className="animate-rise-delay-2">
        <div className="grid gap-3 md:grid-cols-2">
          {["Review workflows", "Sync health ingest", "Draft onboarding flow", "Instrument analytics"].map((item) => (
            <div key={item} className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">{item}</p>
              <p className="text-xs text-slate-400">Scheduled for next sprint</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
