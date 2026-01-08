import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "../components/start/page";

const goals = [
  { title: "Ship Convex migration", progress: 0.62, meta: "Hard cutover" },
  { title: "Automate calendar sync", progress: 0.45, meta: "Google OAuth" },
  { title: "AI chat v1", progress: 0.38, meta: "Streaming + files" },
];

export const Route = createFileRoute("/goals")({
  component: Goals,
});

function Goals() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Momentum check"
        title="Goals & outcomes"
        subtitle="Track progress across the big bets."
        actions={
          <>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Weekly review
            </button>
            <button type="button" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              New goal
            </button>
          </>
        }
      />

      <Panel title="Active goals" subtitle="Progress captured from tasks + calendar">
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.title} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                  <p className="text-xs text-slate-500">{goal.meta}</p>
                </div>
                <Pill tone="emerald">{Math.round(goal.progress * 100)}%</Pill>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${goal.progress * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Next moves" subtitle="Recommendations" className="animate-rise-delay-1">
          <div className="space-y-3">
            {[
              "Lock iOS OAuth handshake with web flow.",
              "Add Convex workflow for nightly calendar sync.",
              "Define chat retrieval sources before beta.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Milestones" subtitle="Upcoming checkpoints" className="animate-rise-delay-2">
          <div className="space-y-3">
            {["M1 Foundation", "M2 Feature tracks", "M3 Launch readiness"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-700">{item}</p>
                <Pill tone="amber">Queued</Pill>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
