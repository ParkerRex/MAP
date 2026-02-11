import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState } from "react";
import { PageHeader, Panel, Pill } from "../components/start/page";
import { apiRequest } from "../lib/client-api";

export const Route = createFileRoute("/tasks")({
  component: Tasks,
});

type TaskRecord = {
  id: string;
  title: string;
  dueAt: string | null;
  completedAt: string | null;
  taskStatus: "pending" | "in_progress" | "completed" | null;
};

function taskStatus(task: TaskRecord): "pending" | "in_progress" | "completed" {
  if (task.completedAt) return "completed";
  if (task.taskStatus === "in_progress") return "in_progress";
  return "pending";
}

function Tasks() {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiRequest<{ tasks: TaskRecord[] }>("/api/tasks"),
    refetchInterval: 5_000,
  });

  const tasks = tasksQuery.data?.tasks ?? [];

  const createTask = useMutation({
    mutationFn: (payload: { title: string; dueAt?: string }) =>
      apiRequest<{ task: TaskRecord }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleTask = useMutation({
    mutationFn: (payload: { taskId: string; completed: boolean }) =>
      apiRequest<{ task: TaskRecord }>(`/api/tasks/${payload.taskId}`, {
        method: "PUT",
        body: JSON.stringify({ completed: payload.completed }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const removeTask = useMutation({
    mutationFn: (taskId: string) =>
      apiRequest<{ success: boolean }>(`/api/tasks/${taskId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const pendingCount = tasks.filter((task) => taskStatus(task) !== "completed").length;
  const completedCount = tasks.filter((task) => taskStatus(task) === "completed").length;

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    await createTask.mutateAsync({
      title: trimmed,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    });

    setTitle("");
    setDueAt("");
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Execution lane"
        title="Tasks that move the needle"
        subtitle="Live task graph on Postgres + API routes."
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
            <label
              htmlFor="new-task-title"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Title
            </label>
            <input
              id="new-task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Draft rust migration sequence"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <label
              htmlFor="new-task-due-at"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Due
            </label>
            <input
              id="new-task-due-at"
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
            tasks.map((task) => {
              const status = taskStatus(task);
              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {task.dueAt
                          ? `Due ${format(new Date(task.dueAt), "MMM d • h:mm a")}`
                          : "No due date"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={status === "completed" ? "emerald" : "amber"}>{status}</Pill>
                      <button
                        type="button"
                        onClick={() =>
                          void toggleTask.mutateAsync({
                            taskId: task.id,
                            completed: status !== "completed",
                          })
                        }
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {status === "completed" ? "Reopen" : "Complete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeTask.mutateAsync(task.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500"
                      >
                        Archive
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
