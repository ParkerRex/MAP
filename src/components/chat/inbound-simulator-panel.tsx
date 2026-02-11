import { useState } from "react";
import { Panel } from "../start/page";
import { ActionStatusMessage } from "./action-status";
import { getErrorMessage } from "./error-utils";
import type { ActionStatus, InboundMessageResponse } from "./types";

type InboundSimulatorPanelProps = {
  selectedModel: string;
  onSimulateInbound: (payload: {
    provider: string;
    peerKind: string;
    peerId: string;
    text: string;
    dmPolicy: string;
  }) => Promise<InboundMessageResponse>;
};

export function InboundSimulatorPanel({
  selectedModel,
  onSimulateInbound,
}: InboundSimulatorPanelProps) {
  const [inboundProvider, setInboundProvider] = useState("telegram");
  const [inboundPeerKind, setInboundPeerKind] = useState("dm");
  const [inboundPeerId, setInboundPeerId] = useState("user-123");
  const [inboundText, setInboundText] = useState("Hey Clawdbot, give me the top priorities.");
  const [inboundPolicy, setInboundPolicy] = useState("pairing");
  const [result, setResult] = useState<InboundMessageResponse | null>(null);
  const [status, setStatus] = useState<ActionStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInboundSimulation = async () => {
    const provider = inboundProvider.trim();
    const peerKind = inboundPeerKind.trim();
    const peerId = inboundPeerId.trim();
    const text = inboundText.trim();

    if (!provider || !peerKind || !peerId || !text || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await onSimulateInbound({
        provider,
        peerKind,
        peerId,
        text,
        dmPolicy: inboundPolicy,
      });
      setResult(response);
      setStatus({ kind: "success", message: "Inbound simulation completed." });
    } catch (error) {
      setStatus({ kind: "error", message: getErrorMessage(error, "Inbound simulation failed.") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Panel title="Inbound simulator" subtitle="Test channel ingestion and pairing policy">
      <div className="grid gap-6 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Using model: <span className="font-semibold">{selectedModel || "gateway default"}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={inboundProvider}
              onChange={(event) => setInboundProvider(event.target.value)}
              placeholder="provider (telegram, slack...)"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <select
              value={inboundPeerKind}
              onChange={(event) => setInboundPeerKind(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="dm">dm</option>
              <option value="group">group</option>
              <option value="channel">channel</option>
              <option value="thread">thread</option>
            </select>
          </div>
          <input
            value={inboundPeerId}
            onChange={(event) => setInboundPeerId(event.target.value)}
            placeholder="peer id"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={inboundPolicy}
            onChange={(event) => setInboundPolicy(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="pairing">pairing</option>
            <option value="allowlist">allowlist</option>
            <option value="open">open</option>
            <option value="disabled">disabled</option>
          </select>
          <textarea
            value={inboundText}
            onChange={(event) => setInboundText(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => void handleInboundSimulation()}
            disabled={isSubmitting}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending" : "Send simulated inbound"}
          </button>
          <ActionStatusMessage status={status} />
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Result</p>
          {result ? (
            <>
              <p>
                accepted=<span className="font-semibold">{String(result.accepted)}</span> ·
                requires_pairing=
                <span className="font-semibold">{String(result.requires_pairing)}</span>
              </p>
              {result.reason ? <p>reason={result.reason}</p> : null}
              {result.pairing_code ? <p>pairing_code={result.pairing_code}</p> : null}
              {result.session_id ? <p>session_id={result.session_id}</p> : null}
              {result.run_id ? <p>run_id={result.run_id}</p> : null}
              {result.model_used ? <p>model_used={result.model_used}</p> : null}
              {result.output ? (
                <pre className="overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  {result.output}
                </pre>
              ) : null}
            </>
          ) : (
            <p className="text-slate-500">
              Run a simulation to inspect policy and routing behavior.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
