import type { ActionStatus } from "./types";

type ActionStatusMessageProps = {
  status: ActionStatus | null;
};

export function ActionStatusMessage({ status }: ActionStatusMessageProps) {
  if (!status) {
    return null;
  }

  const palette =
    status.kind === "success"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-rose-100 bg-rose-50 text-rose-700";

  return (
    <output className={`rounded-xl border px-3 py-2 text-xs ${palette}`}>{status.message}</output>
  );
}
