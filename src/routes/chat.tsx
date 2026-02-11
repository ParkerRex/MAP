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
import { GatewayWsClient, type GatewayChatEvent } from "../lib/gateway-ws-client";

export const Route = createFileRoute("/chat")({
  component: Chat,
});

const rustGatewayBase = (import.meta.env.VITE_RUST_GATEWAY_URL ?? "http://localhost:18789").replace(
  /\/$/,
  "",
);
const rustGatewayToken = (import.meta.env.VITE_RUST_GATEWAY_TOKEN ?? "").trim();

function Chat() {
  const queryClient = useQueryClient();
  const wsClient = useMemo(
    () =>
      new GatewayWsClient({
        baseHttpUrl: rustGatewayBase,
        token: rustGatewayToken,
        path: "/v1/ws",
        clientName: "map-web-chat",
      }),
    [],
  );

  const [draft, setDraft] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [isDriving, setIsDriving] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [confirmDestructive, setConfirmDestructive] = useState(false);
  const [newThreadStatus, setNewThreadStatus] = useState<ActionStatus | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ["rust-gateway", "sessions"],
    queryFn: () => wsClient.request<Session[]>("sessions.list"),
    refetchInterval: 5000,
  });

  const modelsQuery = useQuery({
    queryKey: ["rust-gateway", "models"],
    queryFn: () => wsClient.request<ModelsResponse>("models.list"),
    staleTime: 30_000,
  });

  const profilesQuery = useQuery({
    queryKey: ["rust-gateway", "models", "profiles"],
    queryFn: () => wsClient.request<AuthProfile[]>("models.profiles.list"),
    staleTime: 10_000,
  });

  const securityQuery = useQuery({
    queryKey: ["rust-gateway", "security", "audit"],
    queryFn: () => wsClient.request<SecurityAuditResponse>("security.audit"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const skillsQuery = useQuery({
    queryKey: ["rust-gateway", "skills"],
    queryFn: () => wsClient.request<SkillsResponse>("skills.list"),
    staleTime: 10_000,
  });

  const cronJobsQuery = useQuery({
    queryKey: ["rust-gateway", "cron", "jobs"],
    queryFn: () => wsClient.request<CronJob[]>("cron.jobs.list"),
    staleTime: 10_000,
  });

  const cronRunsQuery = useQuery({
    queryKey: ["rust-gateway", "cron", "runs"],
    queryFn: () => wsClient.request<CronRun[]>("cron.runs.list"),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  const channelsSummaryQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "summary"],
    queryFn: () => wsClient.request<ChannelsSummaryResponse>("channels.summary"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const channelAccountsQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "accounts"],
    queryFn: () => wsClient.request<ChannelAccount[]>("channels.accounts.list"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const channelRoutesQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "routes"],
    queryFn: () => wsClient.request<ChannelRoute[]>("channels.routes.list"),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const pairingQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "pairing"],
    queryFn: () => wsClient.request<PairingRequest[]>("channels.pairing.list"),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const nodesQuery = useQuery({
    queryKey: ["rust-gateway", "nodes"],
    queryFn: () => wsClient.request<NodesResponse>("nodes.list"),
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
    activeRunIdRef.current = activeRunId;
  }, [activeRunId]);

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

  const historyQuery = useQuery({
    queryKey: ["rust-gateway", "chat", "history", activeSessionId],
    queryFn: () =>
      wsClient.request<{
        session: Session;
        messages: SessionMessage[];
        runs: SessionRun[];
      }>("chat.history", {
        sessionId: activeSessionId ?? undefined,
        messageLimit: 500,
        runLimit: 100,
      }),
    refetchInterval: isDriving ? 1000 : 3000,
  });

  const messages = historyQuery.data?.messages ?? [];
  const runs = historyQuery.data?.runs ?? [];
  const latestRun = runs[0];
  const latestAttempts = latestRun?.metadata?.attempts ?? [];

  useEffect(() => {
    if (!activeSessionId && historyQuery.data?.session?.id) {
      setActiveSessionId(historyQuery.data.session.id);
    }
  }, [activeSessionId, historyQuery.data?.session?.id]);

  const createSessionMutation = useMutation({
    mutationFn: (title?: string) => wsClient.request<CreateSessionResponse>("sessions.create", { title }),
    onSuccess: async (session) => {
      setActiveSessionId(session.id);
      setStreamText("");
      setActiveRunId(null);
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "chat", "history"] });
    },
  });

  const addProfileMutation = useMutation({
    mutationFn: (payload: { provider: string; apiKey: string }) =>
      wsClient.request<AuthProfile>("models.profiles.upsert", {
        provider: payload.provider,
        profileId: `${payload.provider}-${Date.now()}`,
        profileType: "api_key",
        payload: { api_key: payload.apiKey },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "models", "profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "models"] });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) =>
      wsClient.request<{ deleted: boolean }>("models.profiles.delete", { id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "models", "profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "models"] });
    },
  });

  const rescanSkillsMutation = useMutation({
    mutationFn: () => wsClient.request<SkillsResponse>("skills.rescan"),
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
      wsClient.request<CronJob>("cron.jobs.create", {
        name: payload.name,
        scheduleKind: payload.scheduleKind,
        scheduleExpr: payload.scheduleExpr,
        timezone: "UTC",
        payload: { message: payload.message },
        sessionTarget: "main",
        deliveryMode: "append",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "runs"] });
    },
  });

  const runCronJobMutation = useMutation({
    mutationFn: (id: string) => wsClient.request<CronRun>("cron.jobs.run", { id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "runs"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "chat", "history"] });
    },
  });

  const deleteCronJobMutation = useMutation({
    mutationFn: (id: string) => wsClient.request<{ deleted: boolean }>("cron.jobs.delete", { id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "runs"] });
    },
  });

  const approvePairingMutation = useMutation({
    mutationFn: (id: string) =>
      wsClient.request<{
        id: string;
        provider: string;
        peer_key: string;
        status: string;
        allowlisted: boolean;
      }>("channels.pairing.approve", { id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "pairing"] });
    },
  });

  const rejectPairingMutation = useMutation({
    mutationFn: (id: string) =>
      wsClient.request<{
        id: string;
        provider: string;
        peer_key: string;
        status: string;
        allowlisted: boolean;
      }>("channels.pairing.reject", { id }),
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
      wsClient.request<ChannelAccount>("channels.accounts.upsert", {
        provider: payload.provider,
        accountKey: payload.accountKey,
        metadata: payload.metadata,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "accounts"] });
    },
  });

  const deleteChannelAccountMutation = useMutation({
    mutationFn: (id: string) =>
      wsClient.request<{ deleted: boolean }>("channels.accounts.delete", { id }),
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
      wsClient.request<ChannelRoute>("channels.routes.upsert", {
        provider: payload.provider,
        accountId: payload.accountId,
        peerKey: payload.peerKey,
        sessionScope: payload.sessionScope,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "routes"] });
    },
  });

  const deleteChannelRouteMutation = useMutation({
    mutationFn: (id: string) =>
      wsClient.request<{ deleted: boolean }>("channels.routes.delete", { id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "routes"] });
    },
  });

  const requestNodePairingMutation = useMutation({
    mutationFn: (payload: { nodeKey: string; displayName?: string }) =>
      wsClient.request<{ request_id: string; node_key: string; code: string; expires_at: string }>(
        "nodes.pair.request",
        {
          nodeKey: payload.nodeKey,
          displayName: payload.displayName,
          capabilities: {},
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "nodes"] });
    },
  });

  const approveNodePairingMutation = useMutation({
    mutationFn: (id: string) =>
      wsClient.request<{ approved: boolean; node_key: string; token: string }>(
        "nodes.pair.approve",
        { id },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "nodes"] });
    },
  });

  const rejectNodePairingMutation = useMutation({
    mutationFn: (id: string) =>
      wsClient.request<{ rejected: boolean }>("nodes.pair.reject", { id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "nodes"] });
    },
  });

  const verifyNodeMutation = useMutation({
    mutationFn: (payload: { nodeKey: string; token: string }) =>
      wsClient.request<VerifyNodeResponse>("nodes.verify", {
        nodeKey: payload.nodeKey,
        token: payload.token,
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
      wsClient.request<InboundMessageResponse>("channels.inbound", {
        provider: payload.provider,
        peerKind: payload.peerKind,
        peerId: payload.peerId,
        text: payload.text,
        dmPolicy: payload.dmPolicy,
        model: selectedModel || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "channels", "pairing"] });
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
    },
  });

  const generatePreviewMutation = useMutation({
    mutationFn: (payload: { prompt: string; model?: string }) =>
      wsClient.request<GeneratePreviewResponse>("models.generate", {
        prompt: payload.prompt,
        model: payload.model,
      }),
  });

  useEffect(() => {
    const unsubscribe = wsClient.onEvent((event, payload) => {
      if (event !== "chat" || !payload || typeof payload !== "object") {
        return;
      }

      const chatEvent = payload as GatewayChatEvent;
      if (chatEvent.kind === "run.started") {
        setActiveRunId(chatEvent.runId);
        setActiveSessionId(chatEvent.sessionId);
        setStreamText("");
        setIsDriving(true);
        return;
      }

      if (chatEvent.kind === "delta") {
        if (!activeRunIdRef.current || chatEvent.runId === activeRunIdRef.current) {
          setStreamText((previous) => previous + chatEvent.text);
          setIsDriving(true);
        }
        return;
      }

      if (chatEvent.kind === "run.finished") {
        if (!activeRunIdRef.current || chatEvent.runId === activeRunIdRef.current) {
          setIsDriving(false);
          setActiveRunId(null);
          void queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
          void queryClient.invalidateQueries({ queryKey: ["rust-gateway", "chat", "history"] });
        }
        return;
      }

      if (chatEvent.kind === "run.aborted") {
        if (!activeRunIdRef.current || chatEvent.runId === activeRunIdRef.current) {
          setIsDriving(false);
          setActiveRunId(null);
          void queryClient.invalidateQueries({ queryKey: ["rust-gateway", "sessions"] });
          void queryClient.invalidateQueries({ queryKey: ["rust-gateway", "chat", "history"] });
        }
        return;
      }

      if (chatEvent.kind === "injected") {
        void queryClient.invalidateQueries({ queryKey: ["rust-gateway", "chat", "history"] });
      }
    });

    return () => {
      unsubscribe();
      wsClient.close();
    };
  }, [queryClient, wsClient]);

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

    const run = await wsClient.request<{ runId: string; sessionId: string; status: string }>(
      "chat.send",
      {
        sessionId: activeSessionId ?? undefined,
        prompt,
        model: selectedModel || undefined,
        confirmed: confirmDestructive,
        idempotencyKey: `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    );

    setDraft("");
    setConfirmDestructive(false);
    setActiveSessionId(run.sessionId);
    setActiveRunId(run.runId);
    setStreamText("");
    setIsDriving(true);
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
          messagesLoading={historyQuery.isLoading}
          messagesError={historyQuery.isError}
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
