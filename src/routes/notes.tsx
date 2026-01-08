import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { PageHeader, Panel, Pill } from "../components/start/page";

export const Route = createFileRoute("/notes")({
  component: Notes,
});

function Notes() {
  const [search, setSearch] = useState("");
  const { data: notes = [] } = useQuery({
    ...convexQuery(api.notes.list, { query: search }),
  });
  const createNote = useMutation({
    mutationFn: useConvexMutation(api.notes.create),
  });
  const updateNote = useMutation({
    mutationFn: useConvexMutation(api.notes.update),
  });
  const removeNote = useMutation({
    mutationFn: useConvexMutation(api.notes.remove),
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNote = useMemo(
    () => notes.find((note) => note._id === selectedId) ?? null,
    [notes, selectedId],
  );
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
  }, [selectedNote?._id, selectedNote?.updatedAt]);

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    await createNote.mutateAsync({ title: trimmedTitle, content });
    setTitle("");
    setContent("");
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    await updateNote.mutateAsync({
      noteId: selectedNote._id,
      title: editTitle,
      content: editContent,
    });
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Idea vault"
        title="Notes you can trust"
        subtitle="Capture, tag, and resurface insights with real-time search."
        actions={
          <>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              New note
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Capture note" subtitle="Save an insight">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Convex migration checklist"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Content</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              placeholder="Notes, prompts, or specs..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Save note
            </button>
          </div>
        </Panel>
        <Panel title="Library" subtitle="Realtime notes" className="animate-rise-delay-1">
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                No notes yet. Capture your first insight.
              </div>
            ) : (
              notes.map((note) => (
                <button
                  key={note._id}
                  type="button"
                  onClick={() => setSelectedId(note._id)}
                  className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-4 text-left transition hover:border-slate-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{note.content}</p>
                    </div>
                    <Pill tone="slate">Open</Pill>
                  </div>
                </button>
              ))
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Note detail" subtitle="Edit or archive" className="animate-rise-delay-2">
        {selectedNote ? (
          <div className="space-y-3">
            <input
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows={6}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => selectedNote && void removeNote.mutateAsync({ noteId: selectedNote._id })}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-rose-500"
              >
                Archive
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
            Select a note to view and edit.
          </div>
        )}
      </Panel>
    </div>
  );
}
