import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { PageHeader, Panel, Pill } from "../components/start/page";

export const Route = createFileRoute("/goals")({
  component: Goals,
});

function Goals() {
  const { data: goals = [] } = useQuery({
    ...convexQuery(api.goals.list, {}),
  });
  const createGoal = useMutation({
    mutationFn: useConvexMutation(api.goals.create),
  });
  const toggleGoal = useMutation({
    mutationFn: useConvexMutation(api.goals.toggle),
  });
  const removeGoal = useMutation({
    mutationFn: useConvexMutation(api.goals.remove),
  });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("health");
  const [dueAt, setDueAt] = useState("");

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const dueTimestamp = dueAt ? new Date(dueAt).getTime() : undefined;
    await createGoal.mutateAsync({ title: trimmed, category, dueAt: dueTimestamp });
    setTitle("");
    setDueAt("");
  };

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
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              New goal
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="New goal" subtitle="Define the outcome">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Launch Convex migration"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            >
              <option value="health">Health</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="family">Family</option>
              <option value="spiritual">Spiritual</option>
            </select>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Due</label>
            <input
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Save goal
            </button>
          </div>
        </Panel>
        <Panel title="Momentum" subtitle="Completion split" className="animate-rise-delay-1">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Active goals</p>
                <Pill tone="amber">{goals.filter((goal) => goal.status !== "completed").length}</Pill>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Completed</p>
                <Pill tone="emerald">{goals.filter((goal) => goal.status === "completed").length}</Pill>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Goal list" subtitle="Realtime outcomes" className="animate-rise-delay-2">
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
              No goals yet. Add the next big outcome.
            </div>
          ) : (
            goals.map((goal) => (
              <div key={goal._id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                    <p className="text-xs text-slate-500">{goal.category}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={goal.status === "completed" ? "emerald" : "amber"}>{goal.status}</Pill>
                    <button
                      type="button"
                      onClick={() => void toggleGoal.mutateAsync({ goalId: goal._id })}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {goal.status === "completed" ? "Reopen" : "Complete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeGoal.mutateAsync({ goalId: goal._id })}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500"
                    >
                      Archive
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
