import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "../components/start/page";

const seedMessages = [
  {
    id: "m1",
    role: "assistant",
    content: "I can draft your migration checklist and surface any missing dependencies.",
  },
  {
    id: "m2",
    role: "user",
    content: "Map the steps we still need for agents + streaming + files.",
  },
  {
    id: "m3",
    role: "assistant",
    content: "Got it. I’ll outline agent threads, persistent streaming setup, and file storage flow.",
  },
];

export const Route = createFileRoute("/chat")({
  component: Chat,
});

function Chat() {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Agent copilot"
        title="Chat with your system"
        subtitle="Streaming responses + file context, powered by Convex Agents."
        actions={
          <button type="button" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
            New thread
          </button>
        }
      />

      <Panel title="Active thread" subtitle="Live stream preview" className="animate-rise-delay-1">
        <div className="space-y-4">
          {seedMessages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                message.role === "assistant"
                  ? "bg-slate-900 text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)]"
                  : "ml-auto bg-white text-slate-700 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]"
              }`}
            >
              {message.content}
            </div>
          ))}
          <div className="max-w-[70%] rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-xs text-slate-500">
            Streaming response will appear here in real time.
          </div>
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
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Attach file
            </button>
            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Send
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
