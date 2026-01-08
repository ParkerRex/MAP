import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "../components/start/page";

const notes = [
  { title: "Convex schema mapping", tag: "Backend", excerpt: "Lean tables for tasks, notes, health and agents." },
  { title: "AI copilot tone", tag: "Product", excerpt: "Short, tactical, always nudging to next action." },
  { title: "Launch plan", tag: "Ops", excerpt: "Hard cutover, Google OAuth, iOS beta." },
];

const stacks = [
  { label: "In-flight", count: 6 },
  { label: "Reference", count: 24 },
  { label: "Archived", count: 18 },
];

export const Route = createFileRoute("/notes")({
  component: Notes,
});

function Notes() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Idea vault"
        title="Notes you can trust"
        subtitle="Capture, tag, and resurface insights with real-time search."
        actions={
          <>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Smart filters
            </button>
            <button type="button" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              New note
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Recent notes" subtitle="Last 24 hours">
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.title} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                    <p className="text-xs text-slate-500">{note.excerpt}</p>
                  </div>
                  <Pill tone="slate">{note.tag}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Stacks" subtitle="Auto-sorted from Convex tags" className="animate-rise-delay-1">
          <div className="space-y-3">
            {stacks.map((stack) => (
              <div key={stack.label} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{stack.label}</p>
                  <Pill tone="emerald">{stack.count} notes</Pill>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Drafts" subtitle="Notes waiting for polish" className="animate-rise-delay-2">
        <div className="grid gap-3 md:grid-cols-3">
          {["Integration checklist", "Agent prompt bank", "Sync quality metrics"].map((item) => (
            <div key={item} className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">{item}</p>
              <p className="text-xs text-slate-400">Draft mode</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
