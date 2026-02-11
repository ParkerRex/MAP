import { useMemo, useState } from "react";
import { Panel } from "../start/page";
import { ActionStatusMessage } from "./action-status";
import { getErrorMessage } from "./error-utils";
import type {
  ActionStatus,
  ChannelAccount,
  ChannelRoute,
  ChannelsSummaryResponse,
  PairingRequest,
} from "./types";

type ChannelsPanelProps = {
  summary: ChannelsSummaryResponse | undefined;
  summaryLoading: boolean;
  summaryError: boolean;
  pairingRequests: PairingRequest[];
  pairingLoading: boolean;
  pairingError: boolean;
  accounts: ChannelAccount[];
  accountsLoading: boolean;
  accountsError: boolean;
  routes: ChannelRoute[];
  routesLoading: boolean;
  routesError: boolean;
  onApprovePairing: (requestId: string) => Promise<void>;
  onRejectPairing: (requestId: string) => Promise<void>;
  onUpsertAccount: (payload: {
    provider: string;
    accountKey: string;
    metadata: Record<string, unknown>;
  }) => Promise<void>;
  onDeleteAccount: (accountId: string) => Promise<void>;
  onUpsertRoute: (payload: {
    provider: string;
    accountId: string | null;
    peerKey: string;
    sessionScope: string;
  }) => Promise<void>;
  onDeleteRoute: (routeId: string) => Promise<void>;
};

export function ChannelsPanel({
  summary,
  summaryLoading,
  summaryError,
  pairingRequests,
  pairingLoading,
  pairingError,
  accounts,
  accountsLoading,
  accountsError,
  routes,
  routesLoading,
  routesError,
  onApprovePairing,
  onRejectPairing,
  onUpsertAccount,
  onDeleteAccount,
  onUpsertRoute,
  onDeleteRoute,
}: ChannelsPanelProps) {
  const connectors = summary?.connectors ?? [];
  const [accountProvider, setAccountProvider] = useState("telegram");
  const [accountKey, setAccountKey] = useState("default");
  const [accountMetadata, setAccountMetadata] = useState("{}");
  const [routeProvider, setRouteProvider] = useState("telegram");
  const [routeAccountId, setRouteAccountId] = useState("");
  const [routePeerKey, setRoutePeerKey] = useState("telegram:dm:user-123");
  const [routeScope, setRouteScope] = useState("agent:main:main");

  const [accountStatus, setAccountStatus] = useState<ActionStatus | null>(null);
  const [routeStatus, setRouteStatus] = useState<ActionStatus | null>(null);
  const [pairingStatus, setPairingStatus] = useState<ActionStatus | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [pendingPairingId, setPendingPairingId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account] as const)),
    [accounts],
  );

  const handleSaveAccount = async () => {
    if (isSavingAccount) {
      return;
    }

    const provider = accountProvider.trim().toLowerCase();
    const key = accountKey.trim();
    if (!provider || !key) {
      setAccountStatus({ kind: "error", message: "provider and account key are required." });
      return;
    }

    let parsedMetadata: Record<string, unknown> = {};
    const metadataRaw = accountMetadata.trim();
    if (metadataRaw) {
      try {
        const json = JSON.parse(metadataRaw) as unknown;
        if (!json || Array.isArray(json) || typeof json !== "object") {
          throw new Error("Metadata must be a JSON object.");
        }
        parsedMetadata = json as Record<string, unknown>;
      } catch (error) {
        setAccountStatus({
          kind: "error",
          message: getErrorMessage(error, "Invalid metadata JSON."),
        });
        return;
      }
    }

    setIsSavingAccount(true);
    try {
      await onUpsertAccount({ provider, accountKey: key, metadata: parsedMetadata });
      setAccountStatus({ kind: "success", message: `Account ${provider}:${key} saved.` });
    } catch (error) {
      setAccountStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to save channel account."),
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (deletingAccountId || deletingRouteId) {
      return;
    }

    setDeletingAccountId(accountId);
    try {
      await onDeleteAccount(accountId);
      setAccountStatus({ kind: "success", message: "Channel account deleted." });
    } catch (error) {
      setAccountStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to delete channel account."),
      });
    } finally {
      setDeletingAccountId(null);
    }
  };

  const handleSaveRoute = async () => {
    if (isSavingRoute) {
      return;
    }

    const provider = routeProvider.trim().toLowerCase();
    const peerKey = routePeerKey.trim();
    const sessionScope = routeScope.trim();
    if (!provider || !peerKey || !sessionScope) {
      setRouteStatus({
        kind: "error",
        message: "provider, peer key, and session scope are required.",
      });
      return;
    }

    setIsSavingRoute(true);
    try {
      await onUpsertRoute({
        provider,
        accountId: routeAccountId.trim() ? routeAccountId : null,
        peerKey,
        sessionScope,
      });
      setRouteStatus({ kind: "success", message: `Route ${provider}:${peerKey} saved.` });
    } catch (error) {
      setRouteStatus({ kind: "error", message: getErrorMessage(error, "Failed to save route.") });
    } finally {
      setIsSavingRoute(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (deletingAccountId || deletingRouteId) {
      return;
    }

    setDeletingRouteId(routeId);
    try {
      await onDeleteRoute(routeId);
      setRouteStatus({ kind: "success", message: "Channel route deleted." });
    } catch (error) {
      setRouteStatus({ kind: "error", message: getErrorMessage(error, "Failed to delete route.") });
    } finally {
      setDeletingRouteId(null);
    }
  };

  const handleApprovePairing = async (requestId: string) => {
    if (pendingPairingId) {
      return;
    }

    setPendingPairingId(requestId);
    try {
      await onApprovePairing(requestId);
      setPairingStatus({ kind: "success", message: "Pairing request approved." });
    } catch (error) {
      setPairingStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to approve pairing request."),
      });
    } finally {
      setPendingPairingId(null);
    }
  };

  const handleRejectPairing = async (requestId: string) => {
    if (pendingPairingId) {
      return;
    }

    setPendingPairingId(requestId);
    try {
      await onRejectPairing(requestId);
      setPairingStatus({ kind: "success", message: "Pairing request rejected." });
    } catch (error) {
      setPairingStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to reject pairing request."),
      });
    } finally {
      setPendingPairingId(null);
    }
  };

  return (
    <Panel title="Channels + pairing" subtitle="Inbound connector posture, routing, and approvals">
      <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Connectors
            </p>
            {summaryLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading channel summary...</p>
            ) : summaryError ? (
              <p className="mt-2 text-sm text-rose-600">Failed to load channel summary.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-700">
                  Accounts: <span className="font-semibold">{summary?.account_count ?? 0}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Routes: <span className="font-semibold">{summary?.route_count ?? 0}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {connectors.slice(0, 12).map((connector) => (
                    <span
                      key={connector}
                      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500"
                    >
                      {connector}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Account CRUD
            </p>
            <input
              value={accountProvider}
              onChange={(event) => setAccountProvider(event.target.value)}
              placeholder="provider"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <input
              value={accountKey}
              onChange={(event) => setAccountKey(event.target.value)}
              placeholder="account_key"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <textarea
              value={accountMetadata}
              onChange={(event) => setAccountMetadata(event.target.value)}
              rows={3}
              placeholder='metadata JSON (e.g. {"workspace":"ops"})'
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={() => void handleSaveAccount()}
              disabled={isSavingAccount}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingAccount ? "Saving" : "Save account"}
            </button>
            <ActionStatusMessage status={accountStatus} />
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Route CRUD
            </p>
            <input
              value={routeProvider}
              onChange={(event) => setRouteProvider(event.target.value)}
              placeholder="provider"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <select
              value={routeAccountId}
              onChange={(event) => setRouteAccountId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="">no account binding</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.provider}:{account.account_key}
                </option>
              ))}
            </select>
            <input
              value={routePeerKey}
              onChange={(event) => setRoutePeerKey(event.target.value)}
              placeholder="peer_key"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <input
              value={routeScope}
              onChange={(event) => setRouteScope(event.target.value)}
              placeholder="session_scope"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={() => void handleSaveRoute()}
              disabled={isSavingRoute}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingRoute ? "Saving" : "Save route"}
            </button>
            <ActionStatusMessage status={routeStatus} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Pairing queue
            </p>
            <ActionStatusMessage status={pairingStatus} />
            {pairingLoading ? (
              <p className="text-sm text-slate-500">Loading pairing requests...</p>
            ) : pairingError ? (
              <p className="text-sm text-rose-600">Failed to load pairing requests.</p>
            ) : pairingRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No pairing requests queued.</p>
            ) : (
              pairingRequests.slice(0, 20).map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {request.provider}:{request.peer_key}
                      </p>
                      <p className="text-xs text-slate-500">
                        status={request.status} · code={request.code}
                      </p>
                      <p className="text-xs text-slate-500">
                        expires {new Date(request.expires_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleApprovePairing(request.id)}
                        disabled={Boolean(pendingPairingId)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pendingPairingId === request.id ? "Working" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRejectPairing(request.id)}
                        disabled={Boolean(pendingPairingId)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pendingPairingId === request.id ? "Working" : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Accounts
            </p>
            {accountsLoading ? (
              <p className="text-sm text-slate-500">Loading accounts...</p>
            ) : accountsError ? (
              <p className="text-sm text-rose-600">Failed to load accounts.</p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-slate-500">No channel accounts saved.</p>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {account.provider}:{account.account_key}
                      </p>
                      <pre className="mt-1 max-h-20 overflow-auto rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-500">
                        {JSON.stringify(account.metadata, null, 2)}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountProvider(account.provider);
                          setAccountKey(account.account_key);
                          setAccountMetadata(JSON.stringify(account.metadata, null, 2));
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAccount(account.id)}
                        disabled={Boolean(deletingAccountId || deletingRouteId)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingAccountId === account.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Routes
            </p>
            {routesLoading ? (
              <p className="text-sm text-slate-500">Loading routes...</p>
            ) : routesError ? (
              <p className="text-sm text-rose-600">Failed to load routes.</p>
            ) : routes.length === 0 ? (
              <p className="text-sm text-slate-500">No channel routes saved.</p>
            ) : (
              routes.map((route) => (
                <div
                  key={route.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {route.provider}:{route.peer_key}
                      </p>
                      <p className="text-xs text-slate-500">session_scope={route.session_scope}</p>
                      <p className="text-xs text-slate-500">
                        account=
                        {route.account_id
                          ? (accountById.get(route.account_id)?.account_key ?? route.account_id)
                          : "none"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRouteProvider(route.provider);
                          setRouteAccountId(route.account_id ?? "");
                          setRoutePeerKey(route.peer_key);
                          setRouteScope(route.session_scope);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRoute(route.id)}
                        disabled={Boolean(deletingAccountId || deletingRouteId)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingRouteId === route.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
