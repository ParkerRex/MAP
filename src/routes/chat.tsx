import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionStatusMessage } from "../components/chat/action-status";
import { ActiveSessionPanel } from "../components/chat/active-session-panel";
import { ChannelsPanel } from "../components/chat/channels-panel";
import { CronPanel } from "../components/chat/cron-panel";
import { getErrorMessage } from "../components/chat/error-utils";
import { InboundSimulatorPanel } from "../components/chat/inbound-simulator-panel";
import { ModelsPanel } from "../components/chat/models-panel";
import { NodesPanel } from "../components/chat/nodes-panel";
import { SecurityPanel } from "../components/chat/security-panel";
import { SessionsPanel } from "../components/chat/sessions-panel";
import { SkillsPanel } from "../components/chat/skills-panel";
import type {
  ActionStatus,
  AuthProfile,
  ChannelAccount,
  ChannelRoute,
  ChannelsSummaryResponse,
  CreateRunResponse,
  CreateSessionResponse,
  CronJob,
  CronRun,
  GeneratePreviewResponse,
  InboundMessageResponse,
  ModelsResponse,
  NodesResponse,
  PairingRequest,
  SecurityAuditResponse,
  Session,
  SessionMessage,
  SessionRun,
  SkillsResponse,
  VerifyNodeResponse,
} from "../components/chat/types";
import { PageHeader } from "../components/start/page";

export const Route = createFileRoute("/chat")({
  component: Chat,
});

const rustGatewayBase = (import.meta.env.VITE_RUST_GATEWAY_URL ?? "http://localhost:18789").replace(
  /\/$/,
  "",
);
const rustGatewayToken = (import.meta.env.VITE_RUST_GATEWAY_TOKEN ?? "").trim();

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${rustGatewayBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(rustGatewayToken ? { Authorization: `Bearer ${rustGatewayToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const fallback = `Request failed (${response.status})`;
    try {
      const json = (await response.json()) as { error?: string };
      throw new Error(json.error ?? fallback);
    } catch {
      throw new Error(fallback);
    }
  }

  return (await response.json()) as T;
}

function Chat() {
  const queryClient = useQueryClient();
  const streamRef = useRef<EventSource | null>(null);

  const [draft, setDraft] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [isDriving, setIsDriving] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [confirmDestructive, setConfirmDestructive] = useState(false);
  const [newThreadStatus, setNewThreadStatus] = useState<ActionStatus | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ["rust-gateway", "sessions"],
    queryFn: () => requestJson<Session[]>("/v1/sessions"),
    refetchInterval: 5000,
  });

  const modelsQuery = useQuery({
    queryKey: ["rust-gateway", "models"],
    queryFn: () => requestJson<ModelsResponse>("/v1/models"),
    staleTime: 30_000,
  });

  const profilesQuery = useQuery({
    queryKey: ["rust-gateway", "models", "profiles"],
    queryFn: () => requestJson<AuthProfile[]>("/v1/models/profiles"),
    staleTime: 10_000,
  });

  const securityQuery = useQuery({
    queryKey: ["rust-gateway", "security", "audit"],
    queryFn: () => requestJson<SecurityAuditResponse>("/v1/security/audit"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const skillsQuery = useQuery({
    queryKey: ["rust-gateway", "skills"],
    queryFn: () => requestJson<SkillsResponse>("/v1/skills"),
    staleTime: 10_000,
  });

  const cronJobsQuery = useQuery({
    queryKey: ["rust-gateway", "cron", "jobs"],
    queryFn: () => requestJson<CronJob[]>("/v1/cron/jobs"),
    staleTime: 10_000,
  });

  const cronRunsQuery = useQuery({
    queryKey: ["rust-gateway", "cron", "runs"],
    queryFn: () => requestJson<CronRun[]>("/v1/cron/runs"),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  const channelsSummaryQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "summary"],
    queryFn: () => requestJson<ChannelsSummaryResponse>("/v1/channels"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const channelAccountsQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "accounts"],
    queryFn: () => requestJson<ChannelAccount[]>("/v1/channels/accounts"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const channelRoutesQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "routes"],
    queryFn: () => requestJson<ChannelRoute[]>("/v1/channels/routes"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const pairingQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "pairing"],
    queryFn: () => requestJson<PairingRequest[]>("/v1/channels/pairing"),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const nodesQuery = useQuery({
    queryKey: ["rust-gateway", "nodes"],
    queryFn: () => requestJson<NodesResponse>("/v1/nodes"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const modelOptions = useMemo(() => {
    const payload = modelsQuery.data;
    if (!payload) {
      return [];
    }

    return Array.from(new Set([payload.primary_model, ...payload.fallback_models]));
  }, [modelsQuery.data]);

  const sessions = sessionsQuery.data ?? [];

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    if (!selectedModel && modelsQuery.data?.primary_model) {
      setSelectedModel(modelsQuery.data.primary_model);
    }
  }, [modelsQuery.data?.primary_model, selectedModel]);

  const messagesQuery = useQuery({
    queryKey: ["rust-gateway", "sessions", activeSessionId, "messages"],
    queryFn: () => requestJson<SessionMessage[]>(`/v1/sessions/${activeSessionId}/messages`),
    enabled: Boolean(activeSessionId),
    refetchInterval: isDriving ? 1000 : 3000,
  });

  const runsQuery = useQuery({
    queryKey: ["rust-gateway", "sessions", activeSessionId, "runs"],
    queryFn: () => requestJson<SessionRun[]>(`/v1/sessions/${activeSessionId}/runs`),
    enabled: Boolean(activeSessionId),
    refetchInterval: isDriving ? 1000 : 3000,
  });

  const messages = messagesQuery.data ?? [];
  const runs = runsQuery.data ?? [];
  const latestRun = runs[0];
  const latestAttempts = latestRun?.metadata?.attempts ?? [];

  const createSessionMutation = useMutation({
    mutationFn: (title?: string) =>
      requestJson<CreateSessionResponse>("/v1/sessions", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onSuccess: async (session) => {
      setActiveSessionId(session.id);
      setStreamText("");
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
    },
  });

  const createRunMutation = useMutation({
    mutationFn: (payload: {
      sessionId?: string;
      prompt: string;
      model?: string;
      confirmed?: boolean;
    }) =>
      requestJson<CreateRunResponse>("/v1/chat/runs", {
        method: "POST",
        body: JSON.stringify({
          session_id: payload.sessionId,
          prompt: payload.prompt,
          model: payload.model,
          confirmed: payload.confirmed,
        }),
      }),
  });

  const addProfileMutation = useMutation({
    mutationFn: (payload: { provider: string; apiKey: string }) =>
      requestJson<AuthProfile>("/v1/models/profiles", {
        method: "POST",
        body: JSON.stringify({
          provider: payload.provider,
          profile_id: `${payload.provider}-${Date.now()}`,
          profile_type: "api_key",
          payload: { api_key: payload.apiKey },
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "models", "profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "models"] });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<{ deleted: boolean }>(`/v1/models/profiles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "models", "profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "models"] });
    },
  });

  const rescanSkillsMutation = useMutation({
    mutationFn: () =>
      requestJson<SkillsResponse>("/v1/skills", {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "skills"] });
    },
  });

  const createCronJobMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      scheduleKind: string;
      scheduleExpr: string;
      message: string;
    }) =>
      requestJson<CronJob>("/v1/cron/jobs", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          schedule_kind: payload.scheduleKind,
          schedule_expr: payload.scheduleExpr,
          timezone: "UTC",
          payload: { message: payload.message },
          session_target: "main",
          delivery_mode: "append",
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "runs"] });
    },
  });

  const runCronJobMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<CronRun>(`/v1/cron/jobs/${id}/run`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "runs"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
      if (activeSessionId) {
        await queryClient.invalidateQueries({
          queryKey: ["rust-gateway", "sessions", activeSessionId, "messages"],
        });
      }
    },
  });

  const deleteCronJobMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<{ deleted: boolean }>(`/v1/cron/jobs/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "runs"] });
    },
  });

  const approvePairingMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<{
        id: string;
        provider: string;
        peer_key: string;
        status: string;
        allowlisted: boolean;
      }>(`/v1/channels/pairing/${id}/approve`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "pairing"] });
    },
  });

  const rejectPairingMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<{
        id: string;
        provider: string;
        peer_key: string;
        status: string;
        allowlisted: boolean;
      }>(`/v1/channels/pairing/${id}/reject`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "pairing"] });
    },
  });

  const upsertChannelAccountMutation = useMutation({
    mutationFn: (payload: {
      provider: string;
      accountKey: string;
      metadata: Record<string, unknown>;
    }) =>
      requestJson<ChannelAccount>("/v1/channels/accounts", {
        method: "POST",
        body: JSON.stringify({
          provider: payload.provider,
          account_key: payload.accountKey,
          metadata: payload.metadata,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "accounts"] });
    },
  });

  const deleteChannelAccountMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<{ deleted: boolean }>(`/v1/channels/accounts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "routes"] });
    },
  });

  const upsertChannelRouteMutation = useMutation({
    mutationFn: (payload: {
      provider: string;
      accountId: string | null;
      peerKey: string;
      sessionScope: string;
    }) =>
      requestJson<ChannelRoute>("/v1/channels/routes", {
        method: "POST",
        body: JSON.stringify({
          provider: payload.provider,
          account_id: payload.accountId,
          peer_key: payload.peerKey,
          session_scope: payload.sessionScope,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "routes"] });
    },
  });

  const deleteChannelRouteMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<{ deleted: boolean }>(`/v1/channels/routes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "routes"] });
    },
  });

  const requestNodePairingMutation = useMutation({
    mutationFn: (payload: { nodeKey: string; displayName?: string }) =>
      requestJson<{ request_id: string; node_key: string; code: string; expires_at: string }>(
        "/v1/nodes/pair/request",
        {
          method: "POST",
          body: JSON.stringify({
            node_key: payload.nodeKey,
            display_name: payload.displayName,
            capabilities: {},
          }),
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "nodes"] });
    },
  });

  const approveNodePairingMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<{ approved: boolean; node_key: string; token: string }>(
        `/v1/nodes/pair/approve/${id}`,
        {
          method: "POST",
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "nodes"] });
    },
  });

  const rejectNodePairingMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<{ rejected: boolean }>(`/v1/nodes/pair/reject/${id}`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "nodes"] });
    },
  });

  const verifyNodeMutation = useMutation({
    mutationFn: (payload: { nodeKey: string; token: string }) =>
      requestJson<VerifyNodeResponse>("/v1/nodes/verify", {
        method: "POST",
        body: JSON.stringify({
          node_key: payload.nodeKey,
          token: payload.token,
        }),
      }),
  });

  const inboundMessageMutation = useMutation({
    mutationFn: (payload: {
      provider: string;
      peerKind: string;
      peerId: string;
      text: string;
      dmPolicy: string;
    }) =>
      requestJson<InboundMessageResponse>("/v1/channels/inbound", {
        method: "POST",
        body: JSON.stringify({
          provider: payload.provider,
          peer_kind: payload.peerKind,
          peer_id: payload.peerId,
          text: payload.text,
          dm_policy: payload.dmPolicy,
          model: selectedModel || undefined,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "pairing"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
    },
  });

  const generatePreviewMutation = useMutation({
    mutationFn: (payload: { prompt: string; model?: string }) =>
      requestJson<GeneratePreviewResponse>("/v1/models/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: payload.prompt,
          model: payload.model,
        }),
      }),
  });

  useEffect(() => {
    return () => {
      streamRef.current?.close();
      streamRef.current = null;
    };
  }, []);

  const startStream = (streamPath: string) => {
    streamRef.current?.close();

    const streamUrl = rustGatewayToken
      ? `${rustGatewayBase}${streamPath}${streamPath.includes("?") ? "&" : "?"}token=${encodeURIComponent(rustGatewayToken)}`
      : `${rustGatewayBase}${streamPath}`;
    const source = new EventSource(streamUrl);
    streamRef.current = source;
    setStreamText("");
    setIsDriving(true);

    source.onmessage = (event) => {
      setStreamText((previous) => previous + event.data);
    };

    source.addEventListener("done", () => {
      source.close();
      if (streamRef.current === source) {
        streamRef.current = null;
      }
      setIsDriving(false);
      void queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
      if (activeSessionId) {
        void queryClient.invalidateQueries({
          queryKey: ["rust-gateway", "sessions", activeSessionId, "messages"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["rust-gateway", "sessions", activeSessionId, "runs"],
        });
      }
    });

    source.onerror = () => {
      source.close();
      if (streamRef.current === source) {
        streamRef.current = null;
      }
      setIsDriving(false);
    };
  };

  const handleNewThread = async () => {
    try {
      await createSessionMutation.mutateAsync(undefined);
      setNewThreadStatus({ kind: "success", message: "New thread created." });
    } catch (error) {
      setNewThreadStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to create thread."),
      });
    }
  };

  const handleSend = async () => {
    const prompt = draft.trim();
    if (!prompt || isDriving) {
      return;
    }

    const run = await createRunMutation.mutateAsync({
      sessionId: activeSessionId ?? undefined,
      prompt,
      model: selectedModel || undefined,
      confirmed: confirmDestructive,
    });

    setDraft("");
    setConfirmDestructive(false);
    setActiveSessionId(run.session_id);
    startStream(run.stream_path);
  };

  const connectionText = useMemo(() => {
    if (sessionsQuery.isLoading) return "Connecting to Rust gateway...";
    if (sessionsQuery.isError) return "Rust gateway unavailable";
    return `Rust gateway: ${rustGatewayBase}`;
  }, [sessionsQuery.isError, sessionsQuery.isLoading]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Agent copilot"
        title="Chat with your system"
        subtitle="Rust gateway backend with OpenClaw-parity migration in progress."
        actions={
          <button
            type="button"
            onClick={() => void handleNewThread()}
            disabled={createSessionMutation.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createSessionMutation.isPending ? "Creating" : "New thread"}
          </button>
        }
      />

      <div className="space-y-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          {connectionText}
        </div>
        <ActionStatusMessage status={newThreadStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <SessionsPanel
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          sessionsLoading={sessionsQuery.isLoading}
          sessionsError={sessionsQuery.isError}
          profiles={profilesQuery.data ?? []}
          profilesLoading={profilesQuery.isLoading}
          profilesError={profilesQuery.isError}
          providers={(modelsQuery.data?.providers ?? []).map((provider) => provider.provider)}
          onAddProfile={(payload) => addProfileMutation.mutateAsync(payload).then(() => undefined)}
          onDeleteProfile={(profileId) =>
            deleteProfileMutation.mutateAsync(profileId).then(() => undefined)
          }
        />

        <ActiveSessionPanel
          messages={messages}
          messagesLoading={messagesQuery.isLoading}
          messagesError={messagesQuery.isError}
          latestRun={latestRun}
          latestAttempts={latestAttempts}
          draft={draft}
          onDraftChange={setDraft}
          selectedModel={selectedModel}
          onSelectedModelChange={setSelectedModel}
          modelOptions={modelOptions}
          confirmDestructive={confirmDestructive}
          onConfirmDestructiveChange={setConfirmDestructive}
          isDriving={isDriving}
          streamText={streamText}
          onSend={handleSend}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SecurityPanel
          audit={securityQuery.data}
          isLoading={securityQuery.isLoading}
          isError={securityQuery.isError}
        />
        <SkillsPanel
          data={skillsQuery.data}
          isLoading={skillsQuery.isLoading}
          isError={skillsQuery.isError}
          onRescan={() => rescanSkillsMutation.mutateAsync().then(() => undefined)}
        />
      </div>

      <ModelsPanel
        selectedModel={selectedModel}
        onGeneratePreview={(payload) => generatePreviewMutation.mutateAsync(payload)}
      />

      <CronPanel
        jobs={cronJobsQuery.data ?? []}
        runs={cronRunsQuery.data ?? []}
        jobsLoading={cronJobsQuery.isLoading}
        jobsError={cronJobsQuery.isError}
        runsLoading={cronRunsQuery.isLoading}
        runsError={cronRunsQuery.isError}
        onCreateJob={(payload) => createCronJobMutation.mutateAsync(payload).then(() => undefined)}
        onRunNow={(jobId) => runCronJobMutation.mutateAsync(jobId).then(() => undefined)}
        onDeleteJob={(jobId) => deleteCronJobMutation.mutateAsync(jobId).then(() => undefined)}
      />

      <ChannelsPanel
        summary={channelsSummaryQuery.data}
        summaryLoading={channelsSummaryQuery.isLoading}
        summaryError={channelsSummaryQuery.isError}
        pairingRequests={pairingQuery.data ?? []}
        pairingLoading={pairingQuery.isLoading}
        pairingError={pairingQuery.isError}
        accounts={channelAccountsQuery.data ?? []}
        accountsLoading={channelAccountsQuery.isLoading}
        accountsError={channelAccountsQuery.isError}
        routes={channelRoutesQuery.data ?? []}
        routesLoading={channelRoutesQuery.isLoading}
        routesError={channelRoutesQuery.isError}
        onApprovePairing={(requestId) =>
          approvePairingMutation.mutateAsync(requestId).then(() => undefined)
        }
        onRejectPairing={(requestId) =>
          rejectPairingMutation.mutateAsync(requestId).then(() => undefined)
        }
        onUpsertAccount={(payload) =>
          upsertChannelAccountMutation.mutateAsync(payload).then(() => undefined)
        }
        onDeleteAccount={(accountId) =>
          deleteChannelAccountMutation.mutateAsync(accountId).then(() => undefined)
        }
        onUpsertRoute={(payload) =>
          upsertChannelRouteMutation.mutateAsync(payload).then(() => undefined)
        }
        onDeleteRoute={(routeId) =>
          deleteChannelRouteMutation.mutateAsync(routeId).then(() => undefined)
        }
      />

      <InboundSimulatorPanel
        selectedModel={selectedModel}
        onSimulateInbound={(payload) => inboundMessageMutation.mutateAsync(payload)}
      />

      <NodesPanel
        data={nodesQuery.data}
        isLoading={nodesQuery.isLoading}
        isError={nodesQuery.isError}
        onRequestPairing={(payload) =>
          requestNodePairingMutation.mutateAsync(payload).then(() => undefined)
        }
        onApprovePairing={(requestId) => approveNodePairingMutation.mutateAsync(requestId)}
        onRejectPairing={(requestId) =>
          rejectNodePairingMutation.mutateAsync(requestId).then(() => undefined)
        }
        onVerifyNode={(payload) => verifyNodeMutation.mutateAsync(payload)}
      />
    </div>
  );
}
