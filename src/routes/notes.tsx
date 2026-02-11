import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, Pill } from "../components/start/page";
import { apiRequest } from "../lib/client-api";

export const Route = createFileRoute("/notes")({
  component: Notes,
});

type NoteRecord = {
  id: string;
  title: string | null;
  content: string | null;
  folderId: string;
  createdAt: string;
  updatedAt: string | null;
};

type FolderRecord = {
  id: string;
  name: string;
};

function Notes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: () => apiRequest<{ notes: NoteRecord[] }>("/api/notes"),
    refetchInterval: 5_000,
  });

  const coachFolderQuery = useQuery({
    queryKey: ["notes", "coach-folder"],
    queryFn: () =>
      apiRequest<{ folder: FolderRecord }>("/api/folders/coach-notes", { method: "POST" }),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const notes = notesQuery.data?.notes ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((note) => {
      const title = (note.title ?? "").toLowerCase();
      const content = (note.content ?? "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [notes, search]);

  const createNote = useMutation({
    mutationFn: async (payload: { title: string; content: string }) => {
      const folder = coachFolderQuery.data?.folder
        ? coachFolderQuery.data.folder
        : (
            await apiRequest<{ folder: FolderRecord }>("/api/folders/coach-notes", {
              method: "POST",
            })
          ).folder;

      return apiRequest<{ note: NoteRecord }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          folderId: folder.id,
        }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const updateNote = useMutation({
    mutationFn: (payload: { noteId: string; title: string; content: string }) =>
      apiRequest<{ note: NoteRecord }>(`/api/notes/${payload.noteId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const removeNote = useMutation({
    mutationFn: (noteId: string) =>
      apiRequest<{ success: boolean }>(`/api/notes/${noteId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId],
  );

  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title ?? "");
      setEditContent(selectedNote.content ?? "");
    }
  }, [selectedNote?.id, selectedNote?.updatedAt]);

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    await createNote.mutateAsync({ title: trimmedTitle, content });
    setTitle("");
    setContent("");
    await queryClient.invalidateQueries({ queryKey: ["notes"] });
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    await updateNote.mutateAsync({
      noteId: selectedNote.id,
      title: editTitle,
      content: editContent,
    });
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Idea vault"
        title="Notes you can trust"
        subtitle="Capture, tag, and resurface insights on Postgres."
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
            <label
              htmlFor="new-note-title"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Title
            </label>
            <input
              id="new-note-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Rust migration checklist"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
            />
            <label
              htmlFor="new-note-content"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Content
            </label>
            <textarea
              id="new-note-content"
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
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                No notes yet. Capture your first insight.
              </div>
            ) : (
              filtered.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-4 text-left transition hover:border-slate-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {note.title ?? "Untitled"}
                      </p>
                      <p className="line-clamp-2 text-xs text-slate-500">{note.content}</p>
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
                onClick={() => {
                  if (!selectedNote) return;
                  setSelectedId(null);
                  void removeNote.mutateAsync(selectedNote.id);
                }}
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
