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
    </div>
  );
}
