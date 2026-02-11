import { useState } from "react";
import { Panel } from "../start/page";
import { ActionStatusMessage } from "./action-status";
import { getErrorMessage } from "./error-utils";
import type { ActionStatus, NodesResponse, VerifyNodeResponse } from "./types";

type NodesPanelProps = {
  data: NodesResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRequestPairing: (payload: { nodeKey: string; displayName?: string }) => Promise<void>;
  onApprovePairing: (
    requestId: string,
  ) => Promise<{ approved: boolean; node_key: string; token: string }>;
  onRejectPairing: (requestId: string) => Promise<void>;
  onVerifyNode: (payload: { nodeKey: string; token: string }) => Promise<VerifyNodeResponse>;
};

export function NodesPanel({
  data,
  isLoading,
  isError,
  onRequestPairing,
  onApprovePairing,
  onRejectPairing,
  onVerifyNode,
}: NodesPanelProps) {
  const [newNodeKey, setNewNodeKey] = useState("node-local");
  const [newNodeDisplayName, setNewNodeDisplayName] = useState("Local Node");
  const [issuedNodeToken, setIssuedNodeToken] = useState<string | null>(null);
  const [verifyNodeKey, setVerifyNodeKey] = useState("node-local");
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyNodeResponse | null>(null);

  const [pairingStatus, setPairingStatus] = useState<ActionStatus | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<ActionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleRequestNodePairing = async () => {
    const nodeKey = newNodeKey.trim();
    if (!nodeKey || isRequesting) {
      return;
    }

    setIsRequesting(true);
    try {
      await onRequestPairing({
        nodeKey,
        displayName: newNodeDisplayName.trim() || undefined,
      });
      setPairingStatus({ kind: "success", message: `Pairing request created for ${nodeKey}.` });
    } catch (error) {
      setPairingStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to request node pairing."),
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (pendingRequestId) {
      return;
    }

    setPendingRequestId(requestId);
    try {
      const result = await onApprovePairing(requestId);
      setIssuedNodeToken(result.token);
      setVerifyNodeKey(result.node_key);
      setVerifyToken(result.token);
      setPairingStatus({ kind: "success", message: `Node ${result.node_key} approved.` });
    } catch (error) {
      setPairingStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to approve node pairing."),
      });
    } finally {
      setPendingRequestId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (pendingRequestId) {
      return;
    }

    setPendingRequestId(requestId);
    try {
      await onRejectPairing(requestId);
      setPairingStatus({ kind: "success", message: "Node pairing request rejected." });
    } catch (error) {
      setPairingStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to reject node pairing."),
      });
    } finally {
      setPendingRequestId(null);
    }
  };

  const handleVerify = async () => {
    const nodeKey = verifyNodeKey.trim();
    const token = verifyToken.trim();
    if (!nodeKey || !token || isVerifying) {
      return;
    }

    setIsVerifying(true);
    try {
      const result = await onVerifyNode({ nodeKey, token });
      setVerifyResult(result);
      setVerifyStatus({
        kind: result.ok ? "success" : "error",
        message: result.ok ? "Node token verified." : "Node token did not match.",
      });
    } catch (error) {
      setVerifyStatus({
        kind: "error",
        message: getErrorMessage(error, "Node verify request failed."),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Panel title="Node pairing" subtitle="Approve and verify peer nodes">
      <div className="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Request pairing
          </p>
          <input
            value={newNodeKey}
            onChange={(event) => setNewNodeKey(event.target.value)}
            placeholder="node key"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <input
            value={newNodeDisplayName}
            onChange={(event) => setNewNodeDisplayName(event.target.value)}
            placeholder="display name"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => void handleRequestNodePairing()}
            disabled={isRequesting}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRequesting ? "Creating request" : "Create node pairing request"}
          </button>
          <ActionStatusMessage status={pairingStatus} />

          {issuedNodeToken ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Issued token: <span className="font-semibold">{issuedNodeToken}</span>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-500">
            Pairing mode: {isLoading ? "loading" : (data?.pairing_mode ?? "unknown")}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Verify node token
            </p>
            <input
              value={verifyNodeKey}
              onChange={(event) => setVerifyNodeKey(event.target.value)}
              placeholder="node key"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <input
              value={verifyToken}
              onChange={(event) => setVerifyToken(event.target.value)}
              placeholder="token"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={isVerifying}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? "Verifying" : "Verify node"}
            </button>
            <ActionStatusMessage status={verifyStatus} />
            {verifyResult ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                ok=<span className="font-semibold">{String(verifyResult.ok)}</span>
                {verifyResult.node_id ? (
                  <p className="mt-1">node_id={verifyResult.node_id}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Pending requests
            </p>
            {isLoading ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                Loading node requests...
              </p>
            ) : isError ? (
              <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Failed to load node requests.
              </p>
            ) : (data?.pending_requests ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                No pending node requests.
              </p>
            ) : (
              (data?.pending_requests ?? []).map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  <p className="font-semibold text-slate-900">{request.peer_key}</p>
                  <p className="text-xs text-slate-500">
                    code={request.code} · expires {new Date(request.expires_at).toLocaleString()}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApprove(request.id)}
                      disabled={Boolean(pendingRequestId)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pendingRequestId === request.id ? "Working" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(request.id)}
                      disabled={Boolean(pendingRequestId)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pendingRequestId === request.id ? "Working" : "Reject"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Nodes</p>
            {isLoading ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                Loading nodes...
              </p>
            ) : isError ? (
              <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Failed to load nodes.
              </p>
            ) : (data?.nodes ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                No paired nodes yet.
              </p>
            ) : (
              (data?.nodes ?? []).map((node) => (
                <div
                  key={node.id}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  <p className="font-semibold text-slate-900">
                    {node.display_name ?? node.node_key}
                  </p>
                  <p className="text-xs text-slate-500">
                    {node.node_key} · status={node.pairing_status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
