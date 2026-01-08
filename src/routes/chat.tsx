import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  convexQuery,
  useConvexAction,
  useConvexAuth,
  useConvexMutation,
} from "@convex-dev/react-query";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { api } from "../../convex/_generated/api";
import { PageHeader, Panel, Pill } from "../components/start/page";

export const Route = createFileRoute("/chat")({
  component: Chat,
});

function Chat() {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<
    { fileId: string; filename: string; contentType: string; url: string }[]
  >([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeStreamId, setActiveStreamId] = useState<string | undefined>();
  const [isDriving, setIsDriving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: threads = [] } = useQuery({
    ...convexQuery(api.chat.listThreads, { limit: 20 }),
  });

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0]._id);
    }
  }, [activeThreadId, threads]);

  const { data: messages = [] } = useQuery({
    ...convexQuery(
      api.chat.listMessages,
      activeThreadId ? { threadId: activeThreadId, limit: 40 } : "skip",
    ),
  });

  const createThread = useMutation({
    mutationFn: useConvexMutation(api.chat.createThread),
  });
  const createRun = useMutation({
    mutationFn: useConvexMutation(api.chat.createRun),
  });
  const uploadFile = useMutation({
    mutationFn: useConvexAction(api.chat.uploadFile),
  });

  const { isAuthenticated, fetchAccessToken } = useConvexAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) {
      setAuthToken(null);
      return;
    }
    void fetchAccessToken().then((token) => {
      if (!cancelled) setAuthToken(token);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAccessToken, isAuthenticated]);

  const streamUrl = useMemo(() => {
    const base = import.meta.env.VITE_CONVEX_SITE_URL;
    return new URL(`${base}/chat/stream`);
  }, []);

  const stream = useStream(
    api.chat.getStreamBody,
    streamUrl,
    isDriving,
    activeStreamId,
    { authToken },
  );

  useEffect(() => {
    if (isDriving && stream.status === "done") {
      setIsDriving(false);
      setActiveStreamId(undefined);
    }
  }, [isDriving, stream.status]);

  const handleNewThread = async () => {
    const threadId = await createThread.mutateAsync({});
    setActiveThreadId(threadId);
    setActiveStreamId(undefined);
    setIsDriving(false);
  };

  const handleAttach = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const uploaded = await uploadFile.mutateAsync({
        filename: file.name,
        contentType: file.type,
        bytes,
      });
      setAttachments((prev) => [...prev, uploaded]);
    }
    event.target.value = "";
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    const result = await createRun.mutateAsync({
      threadId: activeThreadId ?? undefined,
      prompt: text,
      fileIds: attachments.map((file) => file.fileId),
    });
    setDraft("");
    setAttachments([]);
    setActiveThreadId(result.threadId);
    setActiveStreamId(result.streamId);
    setIsDriving(true);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Agent copilot"
        title="Chat with your system"
        subtitle="Streaming responses + file context, powered by Convex Agents."
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

      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <Panel title="Threads" subtitle="Active conversations">
          <div className="space-y-3">
            {threads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                No threads yet. Start a new one.
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread._id}
                  type="button"
                  onClick={() => setActiveThreadId(thread._id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    activeThreadId === thread._id
                      ? "border-slate-300 bg-white shadow-[0_12px_30px_-25px_rgba(15,23,42,0.35)]"
                      : "border-slate-100 bg-white/70 hover:border-slate-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {thread.title ?? "Untitled thread"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(thread._creationTime).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Active thread" subtitle="Live stream preview" className="animate-rise-delay-1">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                Send a message to start the thread.
              </div>
            ) : (
              messages.map((message) => {
                const hasFiles = message.parts?.some(
                  (part) => part.type === "file" || part.type === "image",
                );
                return (
                  <div
                    key={message.key}
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === "assistant"
                        ? "bg-slate-900 text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)]"
                        : "ml-auto bg-white text-slate-700 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]"
                    }`}
                  >
                    <p>{message.text}</p>
                    {hasFiles ? (
                      <div className="mt-2">
                        <Pill tone="amber">Attachment</Pill>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}

            {isDriving && stream.text ? (
              <div className="max-w-[80%] rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)]">
                {stream.text}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Message</p>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask the agent to plan, draft, or query..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
              />
              {attachments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <span
                      key={file.fileId}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500"
                    >
                      {file.filename}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleAttach}
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Attach file
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Send
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
