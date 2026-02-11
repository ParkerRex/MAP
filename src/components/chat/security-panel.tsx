import { Panel } from "../start/page";
import type { SecurityAuditResponse } from "./types";

type SecurityPanelProps = {
  audit: SecurityAuditResponse | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function SecurityPanel({ audit, isLoading, isError }: SecurityPanelProps) {
  return (
    <Panel
      title="Security audit"
      subtitle="Gateway runtime checks"
      className="animate-rise-delay-1"
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">
          Status:{" "}
          <span
            className={`font-semibold ${audit?.status === "ok" ? "text-emerald-600" : "text-amber-600"}`}
          >
            {isLoading ? "loading" : isError ? "error" : (audit?.status ?? "unknown")}
          </span>
        </div>
        {isError ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            Failed to load security checks.
          </div>
        ) : (
          (audit?.checks ?? []).map((check) => (
            <div key={check.name} className="rounded-xl border border-slate-100 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">
                {check.name} · {check.ok ? "ok" : "warning"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{check.detail}</p>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
