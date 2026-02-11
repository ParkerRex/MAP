import { useState } from "react";
import { Panel } from "../start/page";
import { ActionStatusMessage } from "./action-status";
import { getErrorMessage } from "./error-utils";
import type { ActionStatus, CronJob, CronRun } from "./types";

type CronPanelProps = {
  jobs: CronJob[];
  runs: CronRun[];
  jobsLoading: boolean;
  jobsError: boolean;
  runsLoading: boolean;
  runsError: boolean;
  onCreateJob: (payload: {
    name: string;
    scheduleKind: string;
    scheduleExpr: string;
    message: string;
  }) => Promise<void>;
  onRunNow: (jobId: string) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
};

export function CronPanel({
  jobs,
  runs,
  jobsLoading,
  jobsError,
  runsLoading,
  runsError,
  onCreateJob,
  onRunNow,
  onDeleteJob,
}: CronPanelProps) {
  const [cronName, setCronName] = useState("Daily standup ping");
  const [cronKind, setCronKind] = useState("every");
  const [cronExpr, setCronExpr] = useState("3600");
  const [cronMessage, setCronMessage] = useState("Send a status recap and next action.");
  const [status, setStatus] = useState<ActionStatus | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = cronName.trim();
    const scheduleExpr = cronExpr.trim();
    const message = cronMessage.trim();
    if (!name || !scheduleExpr || !message || isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateJob({
        name,
        scheduleKind: cronKind,
        scheduleExpr,
        message,
      });
      setStatus({ kind: "success", message: "Cron job created." });
    } catch (error) {
      setStatus({ kind: "error", message: getErrorMessage(error, "Failed to create cron job.") });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunNow = async (jobId: string) => {
    if (runningJobId || deletingJobId) {
      return;
    }

    setRunningJobId(jobId);
    try {
      await onRunNow(jobId);
      setStatus({ kind: "success", message: "Cron job started." });
    } catch (error) {
      setStatus({ kind: "error", message: getErrorMessage(error, "Failed to run cron job.") });
    } finally {
      setRunningJobId(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (runningJobId || deletingJobId) {
      return;
    }

    setDeletingJobId(jobId);
    try {
      await onDeleteJob(jobId);
      setStatus({ kind: "success", message: "Cron job deleted." });
    } catch (error) {
      setStatus({ kind: "error", message: getErrorMessage(error, "Failed to delete cron job.") });
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <Panel title="Cron automation" subtitle="Schedule recurring assistant workflows">
      <div className="grid gap-6 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Create job
          </p>
          <input
            value={cronName}
            onChange={(event) => setCronName(event.target.value)}
            placeholder="Job name"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={cronKind}
              onChange={(event) => setCronKind(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="every">every (seconds)</option>
              <option value="cron">cron expression</option>
              <option value="at">single timestamp (ISO)</option>
            </select>
            <input
              value={cronExpr}
              onChange={(event) => setCronExpr(event.target.value)}
              placeholder={
                cronKind === "every"
                  ? "3600"
                  : cronKind === "cron"
                    ? "0 * * * * *"
                    : "2026-02-11T20:00:00Z"
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <textarea
            value={cronMessage}
            onChange={(event) => setCronMessage(event.target.value)}
            rows={3}
            placeholder="Message injected into session when job runs..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isCreating}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating" : "Create cron job"}
          </button>
          <ActionStatusMessage status={status} />
        </div>

        <div className="space-y-2">
          {jobsLoading ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
              Loading cron jobs...
            </p>
          ) : jobsError ? (
            <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Failed to load cron jobs.
            </p>
          ) : jobs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
              No cron jobs configured.
            </p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{job.name}</p>
                    <p className="text-xs text-slate-500">
                      {job.schedule_kind}: {job.schedule_expr}
                    </p>
                    <p className="text-xs text-slate-500">
                      Next: {job.next_run_at ? new Date(job.next_run_at).toLocaleString() : "n/a"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRunNow(job.id)}
                      disabled={Boolean(runningJobId || deletingJobId)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {runningJobId === job.id ? "Running" : "Run now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(job.id)}
                      disabled={Boolean(runningJobId || deletingJobId)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingJobId === job.id ? "Deleting" : "Delete"}
                    </button>
                  </div>
                </div>
                {job.last_error ? (
                  <p className="mt-2 text-xs text-rose-500">Last error: {job.last_error}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Recent runs
        </p>
        <div className="mt-3 space-y-2">
          {runsLoading ? (
            <p className="text-xs text-slate-500">Loading cron runs...</p>
          ) : runsError ? (
            <p className="text-xs text-rose-600">Failed to load cron runs.</p>
          ) : runs.length === 0 ? (
            <p className="text-xs text-slate-500">No cron runs yet.</p>
          ) : (
            runs.slice(0, 10).map((run) => (
              <div
                key={run.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600"
              >
                <p>
                  status=<span className="font-semibold">{run.status}</span> · started{" "}
                  {new Date(run.started_at).toLocaleString()}
                </p>
                {run.output?.message ? <p className="mt-1">message={run.output.message}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}
