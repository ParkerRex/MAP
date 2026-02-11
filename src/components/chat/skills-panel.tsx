import { useState } from "react";
import { Panel } from "../start/page";
import { ActionStatusMessage } from "./action-status";
import { getErrorMessage } from "./error-utils";
import type { ActionStatus, SkillsResponse } from "./types";

type SkillsPanelProps = {
  data: SkillsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRescan: () => Promise<void>;
};

export function SkillsPanel({ data, isLoading, isError, onRescan }: SkillsPanelProps) {
  const [isRescanning, setIsRescanning] = useState(false);
  const [status, setStatus] = useState<ActionStatus | null>(null);

  const handleRescan = async () => {
    if (isRescanning) {
      return;
    }

    setIsRescanning(true);
    try {
      await onRescan();
      setStatus({ kind: "success", message: "Skills rescanned." });
    } catch (error) {
      setStatus({ kind: "error", message: getErrorMessage(error, "Rescan failed.") });
    } finally {
      setIsRescanning(false);
    }
  };

  return (
    <Panel
      title="Skills"
      subtitle="Discovered OpenClaw/MAP skills"
      className="animate-rise-delay-2"
    >
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleRescan()}
            disabled={isRescanning}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRescanning ? "Rescanning" : "Rescan skills"}
          </button>
        </div>
        <ActionStatusMessage status={status} />

        {isLoading ? (
          <p className="text-xs text-slate-500">Loading skills...</p>
        ) : isError ? (
          <p className="text-xs text-rose-600">Failed to load skills.</p>
        ) : (
          <>
            <p className="text-xs text-slate-500">
              Precedence: {(data?.precedence ?? []).join(" > ")}
            </p>
            {(data?.skills ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">No skills discovered yet.</p>
            ) : (
              <div className="space-y-2">
                {(data?.skills ?? []).slice(0, 24).map((skill) => (
                  <div
                    key={`${skill.skill_key}-${skill.source_type}`}
                    className="rounded-xl border border-slate-100 bg-white px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-slate-900">{skill.skill_key}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {skill.source_type} · {skill.description || "No description"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
