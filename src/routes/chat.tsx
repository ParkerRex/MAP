import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Panel } from "../components/start/page";

export const Route = createFileRoute("/chat")({
  component: Chat,
});

type Session = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type SessionMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | string;
  text: string;
  created_at: string;
};

type CreateSessionResponse = Session;

type CreateRunResponse = {
  run_id: string;
  session_id: string;
  status: string;
  requires_confirmation: boolean;
  stream_path: string;
};

type ModelAttempt = {
  model: string;
  provider: string;
  profile_id: string;
  source: string;
  ok: boolean;
  error?: string | null;
};

type SessionRun = {
  id: string;
  session_id: string;
  prompt: string;
  status: string;
  output: string;
  metadata: {
    model_used?: string;
    attempts?: ModelAttempt[];
    requires_confirmation?: boolean;
  };
  model_used?: string | null;
  created_at: string;
  updated_at: string;
};

type ModelsResponse = {
  primary_model: string;
  fallback_models: string[];
  providers: Array<{
    provider: string;
    base_url: string;
    env_key_configured: boolean;
  }>;
  failover_strategy: string;
};

type AuthProfile = {
  id: string;
  provider: string;
  profile_id: string;
  profile_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type SecurityAuditResponse = {
  status: "ok" | "warning";
  checks: Array<{
    name: string;
    ok: boolean;
    detail: string;
  }>;
};

type SkillsResponse = {
  skills: Array<{
    skill_key: string;
    description: string;
    source_type: string;
    source_path: string;
  }>;
  precedence: string[];
};

type CronJob = {
  id: string;
  name: string;
  schedule_kind: string;
  schedule_expr: string;
  timezone: string | null;
  payload: {
    message?: string;
  };
  session_target: string;
  delivery_mode: string | null;
  enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type CronRun = {
  id: string;
  cron_job_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  output: {
    session_id?: string;
    message?: string;
  };
};

type ChannelsSummaryResponse = {
  connectors: string[];
  account_count: number;
  route_count: number;
};

type PairingRequest = {
  id: string;
  provider: string;
  peer_key: string;
  code: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

type NodeRecord = {
  id: string;
  node_key: string;
  display_name: string | null;
  pairing_status: string;
  capabilities: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type NodePairingRequest = {
  id: string;
  provider: string;
  peer_key: string;
  code: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

type NodesResponse = {
  nodes: NodeRecord[];
  pending_requests: NodePairingRequest[];
  pairing_mode: string;
};

type InboundMessageResponse = {
  accepted: boolean;
  requires_pairing: boolean;
  reason?: string | null;
  pairing_request_id?: string | null;
  pairing_code?: string | null;
  pairing_expires_at?: string | null;
  session_id?: string | null;
  session_key?: string | null;
  run_id?: string | null;
  model_used?: string | null;
  output?: string | null;
};

type GeneratePreviewResponse = {
  model_used: string;
  output: string;
  attempts: ModelAttempt[];
};

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

  const [draft, setDraft] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [isDriving, setIsDriving] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [confirmDestructive, setConfirmDestructive] = useState(false);
  const [newProfileProvider, setNewProfileProvider] = useState("moonshot");
  const [newApiKey, setNewApiKey] = useState("");
  const [cronName, setCronName] = useState("Daily standup ping");
  const [cronKind, setCronKind] = useState("every");
  const [cronExpr, setCronExpr] = useState("3600");
  const [cronMessage, setCronMessage] = useState("Send a status recap and next action.");
  const [newNodeKey, setNewNodeKey] = useState("node-local");
  const [newNodeDisplayName, setNewNodeDisplayName] = useState("Local Node");
  const [issuedNodeToken, setIssuedNodeToken] = useState<string | null>(null);
  const [inboundProvider, setInboundProvider] = useState("telegram");
  const [inboundPeerKind, setInboundPeerKind] = useState("dm");
  const [inboundPeerId, setInboundPeerId] = useState("user-123");
  const [inboundText, setInboundText] = useState("Hey Clawdbot, give me the top priorities.");
  const [inboundPolicy, setInboundPolicy] = useState("pairing");
  const [inboundResult, setInboundResult] = useState<InboundMessageResponse | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState(
    "Summarize the current project migration status.",
  );
  const [previewResult, setPreviewResult] = useState<GeneratePreviewResponse | null>(null);
  const streamRef = useRef<EventSource | null>(null);

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

  const channelsSummaryQuery = useQuery({
    queryKey: ["rust-gateway", "channels", "summary"],
    queryFn: () => requestJson<ChannelsSummaryResponse>("/v1/channels"),
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
  const profiles = profilesQuery.data ?? [];

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
      setNewApiKey("");
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
    },
  });

  const runCronJobMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson<CronRun>(`/v1/cron/jobs/${id}/run`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rust-gateway", "cron", "jobs"] });
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

  const requestNodePairingMutation = useMutation({
    mutationFn: (payload: { nodeKey: string; displayName?: string }) =>
      requestJson<{
        request_id: string;
        node_key: string;
        code: string;
        expires_at: string;
      }>("/v1/nodes/pair/request", {
        method: "POST",
        body: JSON.stringify({
          node_key: payload.nodeKey,
          display_name: payload.displayName,
          capabilities: {},
        }),
      }),
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
    onSuccess: async (result) => {
      setIssuedNodeToken(result.token);
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
    onSuccess: async (result) => {
      setInboundResult(result);
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
    onSuccess: (result) => {
      setPreviewResult(result);
    },
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
      setStreamText((prev) => prev + event.data);
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
    await createSessionMutation.mutateAsync(undefined);
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

  const handleAddProfile = async () => {
    const apiKey = newApiKey.trim();
    if (!apiKey) {
      return;
    }
    await addProfileMutation.mutateAsync({ provider: newProfileProvider, apiKey });
  };

  const handleCreateCronJob = async () => {
    const name = cronName.trim();
    const scheduleExpr = cronExpr.trim();
    const message = cronMessage.trim();
    if (!name || !scheduleExpr || !message) {
      return;
    }
    await createCronJobMutation.mutateAsync({
      name,
      scheduleKind: cronKind,
      scheduleExpr,
      message,
    });
  };

  const handleRequestNodePairing = async () => {
    const nodeKey = newNodeKey.trim();
    if (!nodeKey) {
      return;
    }
    await requestNodePairingMutation.mutateAsync({
      nodeKey,
      displayName: newNodeDisplayName.trim() || undefined,
    });
  };

  const handleInboundSimulation = async () => {
    const provider = inboundProvider.trim();
    const peerKind = inboundPeerKind.trim();
    const peerId = inboundPeerId.trim();
    const text = inboundText.trim();
    if (!provider || !peerKind || !peerId || !text) {
      return;
    }
    await inboundMessageMutation.mutateAsync({
      provider,
      peerKind,
      peerId,
      text,
      dmPolicy: inboundPolicy,
    });
  };

  const handleGeneratePreview = async () => {
    const prompt = previewPrompt.trim();
    if (!prompt) {
      return;
    }
    await generatePreviewMutation.mutateAsync({
      prompt,
      model: selectedModel || undefined,
    });
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
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            New thread
          </button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        {connectionText}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <Panel title="Sessions" subtitle="Rust-backed conversation sessions">
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                No sessions yet. Start a new one.
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    activeSessionId === session.id
                      ? "border-slate-300 bg-white shadow-[0_12px_30px_-25px_rgba(15,23,42,0.35)]"
                      : "border-slate-100 bg-white/70 hover:border-slate-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {session.title ?? "Untitled session"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(session.updated_at).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Model auth profiles
            </p>
            <div className="space-y-2">
              {profiles.length === 0 ? (
                <p className="text-xs text-slate-500">No saved profiles yet.</p>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {profile.provider}:{profile.profile_id}
                      </p>
                      <p className="text-[11px] text-slate-500">{profile.profile_type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteProfileMutation.mutateAsync(profile.id)}
                      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2 rounded-xl border border-slate-100 bg-white px-3 py-3">
              <label
                htmlFor="profile-provider"
                className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400"
              >
                Provider
              </label>
              <select
                id="profile-provider"
                value={newProfileProvider}
                onChange={(event) => setNewProfileProvider(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                {modelsQuery.data?.providers.map((provider) => (
                  <option key={provider.provider} value={provider.provider}>
                    {provider.provider}
                  </option>
                )) ?? <option value="moonshot">moonshot</option>}
              </select>
              <label
                htmlFor="profile-api-key"
                className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400"
              >
                API key
              </label>
              <input
                id="profile-api-key"
                type="password"
                value={newApiKey}
                onChange={(event) => setNewApiKey(event.target.value)}
                placeholder="sk-..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              />
              <button
                type="button"
                onClick={() => void handleAddProfile()}
                disabled={addProfileMutation.isPending || !newApiKey.trim()}
                className="w-full rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add profile
              </button>
            </div>
          </div>
        </Panel>

        <Panel
          title="Active session"
          subtitle="Live stream preview"
          className="animate-rise-delay-1"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
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
                  {new Date(latestRun.updated_at).toLocaleString()} · {latestAttempts.length}{" "}
                  attempt{latestAttempts.length === 1 ? "" : "s"}
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Message
              </p>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
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
                onChange={(event) => setSelectedModel(event.target.value)}
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
                onChange={(event) => setConfirmDestructive(event.target.checked)}
              />
              Confirm high-impact actions for this message
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isDriving || createRunMutation.isPending}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDriving ? "Streaming" : "Send"}
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Security audit"
          subtitle="Gateway runtime checks"
          className="animate-rise-delay-1"
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">
              Status:{" "}
              <span
                className={`font-semibold ${securityQuery.data?.status === "ok" ? "text-emerald-600" : "text-amber-600"}`}
              >
                {securityQuery.data?.status ?? "loading"}
              </span>
            </div>
            {(securityQuery.data?.checks ?? []).map((check) => (
              <div
                key={check.name}
                className="rounded-xl border border-slate-100 bg-white px-3 py-2"
              >
                <p className="text-xs font-semibold text-slate-900">
                  {check.name} · {check.ok ? "ok" : "warning"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{check.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Skills"
          subtitle="Discovered OpenClaw/MAP skills"
          className="animate-rise-delay-2"
        >
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void rescanSkillsMutation.mutateAsync()}
                disabled={rescanSkillsMutation.isPending}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Rescan skills
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Precedence: {(skillsQuery.data?.precedence ?? []).join(" > ")}
            </p>
            {(skillsQuery.data?.skills ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">No skills discovered yet.</p>
            ) : (
              <div className="space-y-2">
                {(skillsQuery.data?.skills ?? []).slice(0, 24).map((skill) => (
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
          </div>
        </Panel>
      </div>

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
              disabled={generatePreviewMutation.isPending}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Run model preview
            </button>
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Result
            </p>
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

      <Panel title="Cron automation" subtitle="Schedule recurring assistant workflows">
        <div className="grid gap-6 lg:grid-cols-[0.45fr_0.55fr]">
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Create job
            </p>
            <input
              value={cronName}
              onChange={(event) => setCronName(event.target.value)}
              placeholder="Job name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={cronKind}
                onChange={(event) => setCronKind(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="every">every (seconds)</option>
                <option value="cron">cron expression</option>
                <option value="at">single timestamp (ISO)</option>
              </select>
              <input
                value={cronExpr}
                onChange={(event) => setCronExpr(event.target.value)}
                placeholder={
                  cronKind === "every"
                    ? "3600"
                    : cronKind === "cron"
                      ? "0 * * * * *"
                      : "2026-02-11T20:00:00Z"
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <textarea
              value={cronMessage}
              onChange={(event) => setCronMessage(event.target.value)}
              rows={3}
              placeholder="Message injected into session when job runs..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={() => void handleCreateCronJob()}
              disabled={createCronJobMutation.isPending}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create cron job
            </button>
          </div>

          <div className="space-y-2">
            {(cronJobsQuery.data ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                No cron jobs configured.
              </p>
            ) : (
              (cronJobsQuery.data ?? []).map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{job.name}</p>
                      <p className="text-xs text-slate-500">
                        {job.schedule_kind}: {job.schedule_expr}
                      </p>
                      <p className="text-xs text-slate-500">
                        Next: {job.next_run_at ? new Date(job.next_run_at).toLocaleString() : "n/a"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void runCronJobMutation.mutateAsync(job.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        Run now
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCronJobMutation.mutateAsync(job.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {job.last_error ? (
                    <p className="mt-2 text-xs text-rose-500">Last error: {job.last_error}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Channels + pairing" subtitle="Inbound connector posture and approval queue">
        <div className="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Connectors
            </p>
            <p className="text-sm text-slate-700">
              Accounts:{" "}
              <span className="font-semibold">{channelsSummaryQuery.data?.account_count ?? 0}</span>
            </p>
            <p className="text-sm text-slate-700">
              Routes:{" "}
              <span className="font-semibold">{channelsSummaryQuery.data?.route_count ?? 0}</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {(channelsSummaryQuery.data?.connectors ?? []).slice(0, 10).map((connector) => (
                <span
                  key={connector}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500"
                >
                  {connector}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {(pairingQuery.data ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                No pairing requests queued.
              </p>
            ) : (
              (pairingQuery.data ?? []).slice(0, 20).map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
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
                        onClick={() => void approvePairingMutation.mutateAsync(request.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void rejectPairingMutation.mutateAsync(request.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Inbound simulator" subtitle="Test channel ingestion and pairing policy">
        <div className="grid gap-6 lg:grid-cols-[0.45fr_0.55fr]">
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
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
              disabled={inboundMessageMutation.isPending}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send simulated inbound
            </button>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Result
            </p>
            {inboundResult ? (
              <>
                <p>
                  accepted=<span className="font-semibold">{String(inboundResult.accepted)}</span> ·
                  requires_pairing=
                  <span className="font-semibold">{String(inboundResult.requires_pairing)}</span>
                </p>
                {inboundResult.reason ? <p>reason={inboundResult.reason}</p> : null}
                {inboundResult.pairing_code ? (
                  <p>pairing_code={inboundResult.pairing_code}</p>
                ) : null}
                {inboundResult.session_id ? <p>session_id={inboundResult.session_id}</p> : null}
                {inboundResult.run_id ? <p>run_id={inboundResult.run_id}</p> : null}
                {inboundResult.model_used ? <p>model_used={inboundResult.model_used}</p> : null}
                {inboundResult.output ? (
                  <pre className="overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                    {inboundResult.output}
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
              disabled={requestNodePairingMutation.isPending}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create node pairing request
            </button>
            {issuedNodeToken ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Issued token: <span className="font-semibold">{issuedNodeToken}</span>
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-500">
              Pairing mode: {nodesQuery.data?.pairing_mode ?? "loading"}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Pending requests
              </p>
              {(nodesQuery.data?.pending_requests ?? []).length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                  No pending node requests.
                </p>
              ) : (
                (nodesQuery.data?.pending_requests ?? []).map((request) => (
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
                        onClick={() => void approveNodePairingMutation.mutateAsync(request.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void rejectNodePairingMutation.mutateAsync(request.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Nodes
              </p>
              {(nodesQuery.data?.nodes ?? []).length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                  No paired nodes yet.
                </p>
              ) : (
                (nodesQuery.data?.nodes ?? []).map((node) => (
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
    </div>
  );
}
