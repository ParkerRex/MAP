import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { format } from "date-fns";
import { api } from "../../convex/_generated/api";
import { PageHeader, Panel, Pill } from "../components/start/page";

export const Route = createFileRoute("/tasks")({
  component: Tasks,
});

function Tasks() {
  const { data: tasks = [] } = useQuery({
    ...convexQuery(api.tasks.list, { includeCompleted: true }),
  });
  const createTask = useMutation({
    mutationFn: useConvexMutation(api.tasks.create),
  });
  const toggleTask = useMutation({
    mutationFn: useConvexMutation(api.tasks.toggle),
  });
  const removeTask = useMutation({
    mutationFn: useConvexMutation(api.tasks.remove),
  });

  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const pendingCount = tasks.filter((task) => task.status !== "completed").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const dueTimestamp = dueAt ? new Date(dueAt).getTime() : undefined;
    await createTask.mutateAsync({
      title: trimmed,
      dueAt: dueTimestamp,
    });
    setTitle("");
    setDueAt("");
  };

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
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              New task
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="New task" subtitle="Capture a focus item">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Draft convext migration sequence"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Due</label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Add task
            </button>
          </div>
        </Panel>
        <Panel title="Focus lanes" subtitle="Status rollup" className="animate-rise-delay-1">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Open tasks</p>
                  <p className="text-xs text-slate-500">Pending and in progress</p>
                </div>
                <Pill tone="amber">{pendingCount}</Pill>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Completed</p>
                  <p className="text-xs text-slate-500">Done this cycle</p>
                </div>
                <Pill tone="emerald">{completedCount}</Pill>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Task list" subtitle="Realtime execution feed" className="animate-rise-delay-2">
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
              No tasks yet. Capture the next commitment above.
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.dueAt ? `Due ${format(task.dueAt, "MMM d • h:mm a")}` : "No due date"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={task.status === "completed" ? "emerald" : "amber"}>{task.status}</Pill>
                    <button
                      type="button"
                      onClick={() => void toggleTask.mutateAsync({ taskId: task._id })}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {task.status === "completed" ? "Reopen" : "Complete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeTask.mutateAsync({ taskId: task._id })}
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
