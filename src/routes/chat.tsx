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

  const messages = messagesQuery.data ?? [];

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
    </div>
  );
}
