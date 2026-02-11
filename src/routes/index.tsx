import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "../components/start/page";

const focusBlocks = [
  { time: "08:30", title: "Product planning sprint", detail: "Map AI core flows" },
  { time: "11:00", title: "Calendar + task merge", detail: "Shared timeline" },
  { time: "15:30", title: "Rust agent pass", detail: "Streaming + tools" },
];

const pulse = [
  { label: "Priority tasks", value: "6", note: "2 deep work" },
  { label: "Notes captured", value: "14", note: "4 tagged" },
  { label: "Events today", value: "5", note: "2 flex" },
];

const highlights = [
  { label: "Recovery", value: "78%", tone: "emerald" as const },
  { label: "Sleep debt", value: "-35m", tone: "amber" as const },
  { label: "Momentum", value: "Uptrend", tone: "rose" as const },
];

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Mission control"
        title="Today at a glance"
        subtitle="Postgres + Rust keep the live graph; TanStack Start keeps the surface fast."
        actions={
          <>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              View weekly rhythm
            </button>
            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Start focus mode
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Focus blocks" subtitle="Protected time windows for deep work">
          <div className="space-y-4">
            {focusBlocks.map((block) => (
              <div
                key={block.time}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {block.time}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{block.title}</p>
                  <p className="text-xs text-slate-500">{block.detail}</p>
                </div>
                <Pill tone="emerald">Locked</Pill>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Pulse" subtitle="Signals from every lane" className="animate-rise-delay-1">
          <div className="space-y-4">
            {pulse.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-900 px-4 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                <p className="text-xs text-white/60">{item.note}</p>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center"
                >
                  <Pill tone={item.tone}>{item.label}</Pill>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Team lane"
        subtitle="Fast check-in for what ships next"
        className="animate-rise-delay-2"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Track B", value: "Auth live", detail: "Google OAuth ready" },
            { label: "Track C", value: "Web shell", detail: "Routing + UI scaffolded" },
            { label: "Track D", value: "Agent core", detail: "Streaming + files queued" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-100 bg-white px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500">{card.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
