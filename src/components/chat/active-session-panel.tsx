import { useState } from "react";
import { Panel } from "../start/page";
import { ActionStatusMessage } from "./action-status";
import { getErrorMessage } from "./error-utils";
import type { ActionStatus, ModelAttempt, SessionMessage, SessionRun } from "./types";

type ActiveSessionPanelProps = {
  messages: SessionMessage[];
  messagesLoading: boolean;
  messagesError: boolean;
  latestRun: SessionRun | undefined;
  latestAttempts: ModelAttempt[];
  draft: string;
  onDraftChange: (value: string) => void;
  selectedModel: string;
  onSelectedModelChange: (value: string) => void;
  modelOptions: string[];
  confirmDestructive: boolean;
  onConfirmDestructiveChange: (value: boolean) => void;
  isDriving: boolean;
  streamText: string;
  onSend: () => Promise<void>;
};

export function ActiveSessionPanel({
  messages,
  messagesLoading,
  messagesError,
  latestRun,
  latestAttempts,
  draft,
  onDraftChange,
  selectedModel,
  onSelectedModelChange,
  modelOptions,
  confirmDestructive,
  onConfirmDestructiveChange,
  isDriving,
  streamText,
  onSend,
}: ActiveSessionPanelProps) {
  const [status, setStatus] = useState<ActionStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    if (isSubmitting || isDriving) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSend();
      setStatus({ kind: "success", message: "Run started." });
    } catch (error) {
      setStatus({ kind: "error", message: getErrorMessage(error, "Failed to create run.") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Panel title="Active session" subtitle="Live stream preview" className="animate-rise-delay-1">
      <div className="space-y-4">
        {messagesLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
            Loading messages...
          </div>
        ) : messagesError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Failed to load messages.
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
            Send a message to start this session.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                message.role === "assistant"
                  ? "bg-slate-900 text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)]"
                  : "ml-auto bg-white text-slate-700 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]"
              }`}
            >
              <p>{message.text}</p>
            </div>
          ))
        )}

        {isDriving ? (
          <div className="max-w-[80%] rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)]">
            {streamText || "Thinking..."}
          </div>
        ) : null}

        {latestRun ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Latest run</p>
            <p className="mt-1">
              Status: <span className="font-semibold">{latestRun.status}</span> · Model:{" "}
              <span className="font-semibold">
                {latestRun.model_used ?? latestRun.metadata.model_used ?? "none"}
              </span>
            </p>
            <p className="mt-1 text-slate-500">
              {new Date(latestRun.updated_at).toLocaleString()} · {latestAttempts.length} attempt
              {latestAttempts.length === 1 ? "" : "s"}
            </p>
            {latestAttempts.length > 0 ? (
              <div className="mt-2 space-y-1">
                {latestAttempts.map((attempt, index) => (
                  <p key={`${attempt.profile_id}-${index}`} className="text-slate-500">
                    {attempt.provider}:{attempt.model} via {attempt.profile_id} (
                    {attempt.ok ? "ok" : "failed"})
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Message</p>
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Ask the assistant to plan, draft, or query..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="chat-model"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
          >
            Model
          </label>
          <select
            id="chat-model"
            value={selectedModel}
            onChange={(event) => onSelectedModelChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
          >
            {modelOptions.length === 0 ? (
              <option value="">Loading models...</option>
            ) : (
              modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            )}
          </select>
        </div>
        <label
          htmlFor="chat-confirm-destructive"
          className="flex items-center gap-2 text-xs text-slate-500"
        >
          <input
            id="chat-confirm-destructive"
            type="checkbox"
            checked={confirmDestructive}
            onChange={(event) => onConfirmDestructiveChange(event.target.checked)}
          />
          Confirm high-impact actions for this message
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isDriving || isSubmitting}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDriving ? "Streaming" : isSubmitting ? "Sending" : "Send"}
          </button>
        </div>
        <ActionStatusMessage status={status} />
      </div>
    </Panel>
  );
}
