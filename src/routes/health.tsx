import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, Pill } from "../components/start/page";
import { apiRequest } from "../lib/client-api";

export const Route = createFileRoute("/health")({
  component: Health,
});

type HealthDay = {
  date: string;
  steps: number | null;
  activeEnergy: number | null;
  exerciseMinutes: number | null;
  hrvSDNN: number | null;
  sleepHours: number | null;
};

type SnapshotResponse = {
  connected: boolean;
  lastSyncAt: string | null;
  snapshot: {
    today: HealthDay | null;
    history: HealthDay[];
  };
};

type HealthAverage = {
  steps: number;
  sleepHours: number;
  activeEnergy: number;
  exerciseMinutes: number;
  hrvSDNN: number;
};

function average(values: Array<number | null>): number {
  const valid = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

function buildAverage(days: HealthDay[]): HealthAverage {
  return {
    steps: Math.round(average(days.map((day) => day.steps))),
    sleepHours: average(days.map((day) => day.sleepHours)),
    activeEnergy: Math.round(average(days.map((day) => day.activeEnergy))),
    exerciseMinutes: Math.round(average(days.map((day) => day.exerciseMinutes))),
    hrvSDNN: Math.round(average(days.map((day) => day.hrvSDNN))),
  };
}

function Health() {
  const queryClient = useQueryClient();

  const snapshotQuery = useQuery({
    queryKey: ["health", "snapshot"],
    queryFn: () => apiRequest<SnapshotResponse>("/api/health/apple-health/snapshot"),
    refetchInterval: 30_000,
  });

  const upsert = useMutation({
    mutationFn: (payload: {
      date: string;
      steps?: number;
      sleepHours?: number;
      activeEnergy?: number;
      exerciseMinutes?: number;
    }) =>
      apiRequest<{ success: boolean; recordsProcessed: number }>("/api/health/apple-health/sync", {
        method: "POST",
        body: JSON.stringify({
          syncedAt: new Date().toISOString(),
          healthData: [
            {
              date: payload.date,
              steps: payload.steps,
              sleepHours: payload.sleepHours,
              activeEnergy: payload.activeEnergy,
              exerciseMinutes: payload.exerciseMinutes,
            },
          ],
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["health", "snapshot"] });
    },
  });

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [steps, setSteps] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [activeEnergy, setActiveEnergy] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState("");

  const handleAdd = async () => {
    await upsert.mutateAsync({
      date,
      steps: steps ? Number(steps) : undefined,
      sleepHours: sleepHours ? Number(sleepHours) : undefined,
      activeEnergy: activeEnergy ? Number(activeEnergy) : undefined,
      exerciseMinutes: exerciseMinutes ? Number(exerciseMinutes) : undefined,
    });
  };

  const allDays = useMemo(() => {
    const today = snapshotQuery.data?.snapshot.today;
    const history = snapshotQuery.data?.snapshot.history ?? [];
    return [...history, ...(today ? [today] : [])];
  }, [snapshotQuery.data?.snapshot.history, snapshotQuery.data?.snapshot.today]);

  const recent = allDays.slice(-7);
  const avg = buildAverage(recent);
  const trendMax = Math.max(...allDays.map((entry) => entry.steps ?? 0), 1);

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
              Apple Health sync
            </button>
            <button
              type="button"
              onClick={() => void handleAdd()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Add metric
            </button>
          </>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        {snapshotQuery.data?.connected
          ? `Connected${snapshotQuery.data.lastSyncAt ? ` · Last sync ${new Date(snapshotQuery.data.lastSyncAt).toLocaleString()}` : ""}`
          : "No Apple Health sync yet"}
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        <Panel title="Steps" subtitle="7-day average">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold text-slate-900">{avg.steps || "—"}</p>
            <Pill tone="emerald">Avg</Pill>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 rounded-full bg-slate-900" />
          </div>
        </Panel>
        <Panel title="Sleep" subtitle="Hours/night">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold text-slate-900">
              {avg.sleepHours ? `${avg.sleepHours}h` : "—"}
            </p>
            <Pill tone="amber">Avg</Pill>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 rounded-full bg-slate-900" />
          </div>
        </Panel>
        <Panel title="Active energy" subtitle="kcal/day">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold text-slate-900">{avg.activeEnergy || "—"}</p>
            <Pill tone="rose">Avg</Pill>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 rounded-full bg-slate-900" />
          </div>
        </Panel>
        <Panel title="Exercise" subtitle="min/day">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold text-slate-900">{avg.exerciseMinutes || "—"}</p>
            <Pill tone="slate">Avg</Pill>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${Math.min((avg.exerciseMinutes / 60) * 100, 100)}%` }}
            />
          </div>
        </Panel>
        <Panel title="HRV" subtitle="ms (SDNN)">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold text-slate-900">{avg.hrvSDNN || "—"}</p>
            <Pill tone="slate">Avg</Pill>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${Math.min((avg.hrvSDNN / 100) * 100, 100)}%` }}
            />
          </div>
        </Panel>
      </div>

      <Panel
        title="Log metrics"
        subtitle="Manual entry until HealthKit sync"
        className="animate-rise-delay-1"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Date</p>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Steps</p>
            <input
              type="number"
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Sleep hours
            </p>
            <input
              type="number"
              step="0.1"
              value={sleepHours}
              onChange={(event) => setSleepHours(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Active energy
            </p>
            <input
              type="number"
              value={activeEnergy}
              onChange={(event) => setActiveEnergy(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Exercise minutes
            </p>
            <input
              type="number"
              value={exerciseMinutes}
              onChange={(event) => setExerciseMinutes(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleAdd()}
          className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Save metrics
        </button>
      </Panel>

      <Panel title="Weekly trend" subtitle="Steps by day" className="animate-rise-delay-2">
        <div className="grid grid-cols-7 items-end gap-3">
          {recent.map((entry) => {
            const value = entry.steps ?? 0;
            const height = Math.max((value / trendMax) * 100, 6);
            return (
              <div key={entry.date} className="flex flex-col items-center gap-2">
                <div className="h-24 w-full rounded-2xl bg-slate-100 p-2">
                  <div
                    className="w-full rounded-xl bg-slate-900"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{entry.date.slice(5)}</p>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
