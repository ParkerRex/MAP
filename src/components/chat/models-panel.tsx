import { useState } from "react";
import { Panel } from "../start/page";
import { ActionStatusMessage } from "./action-status";
import { getErrorMessage } from "./error-utils";
import type { ActionStatus, GeneratePreviewResponse } from "./types";

type ModelsPanelProps = {
  selectedModel: string;
  onGeneratePreview: (payload: {
    prompt: string;
    model?: string;
  }) => Promise<GeneratePreviewResponse>;
};

export function ModelsPanel({ selectedModel, onGeneratePreview }: ModelsPanelProps) {
  const [previewPrompt, setPreviewPrompt] = useState(
    "Summarize the current project migration status.",
  );
  const [previewResult, setPreviewResult] = useState<GeneratePreviewResponse | null>(null);
  const [status, setStatus] = useState<ActionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePreview = async () => {
    const prompt = previewPrompt.trim();
    if (!prompt || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await onGeneratePreview({
        prompt,
        model: selectedModel || undefined,
      });
      setPreviewResult(result);
      setStatus({ kind: "success", message: "Model preview completed." });
    } catch (error) {
      setStatus({ kind: "error", message: getErrorMessage(error, "Model preview failed.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Panel
      title="Model preview"
      subtitle="Direct model generation test without session side effects"
    >
      <div className="grid gap-6 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Preview input
          </p>
          <textarea
            value={previewPrompt}
            onChange={(event) => setPreviewPrompt(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => void handleGeneratePreview()}
            disabled={isLoading}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Running preview" : "Run model preview"}
          </button>
          <ActionStatusMessage status={status} />
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Result</p>
          {previewResult ? (
            <>
              <p>
                model_used=<span className="font-semibold">{previewResult.model_used}</span>
              </p>
              <p>attempts={previewResult.attempts.length}</p>
              <pre className="max-h-56 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                {previewResult.output}
              </pre>
            </>
          ) : (
            <p className="text-slate-500">Run preview to inspect model/fallback behavior.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
