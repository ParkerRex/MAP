"use client";

import { subDays } from "date-fns";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useCreateNote, useFolders, useNotes } from "@/hooks/use-notes";
import type { Note } from "@/types/notes";
import FolderSidebar from "./folder-sidebar";
import NoteDisplay from "./note-display";
import NoteList from "./note-list";

export type SortOrder = "lastEdited" | "dateCreated";
export type NoteFilter = "all" | "pinned" | "recent";
export type SearchScope = "all" | "title" | "content";

const PINNED_STORAGE_KEY = "notes.pinnedIds";

export function NotesContent() {
  const { data: notesData } = useNotes();
  const { data: foldersData } = useFolders();

  const notes = notesData?.notes ?? [];
  const folders = foldersData?.folders ?? [];

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearching = searchQuery !== deferredSearchQuery;
  const [sortOrder, setSortOrder] = useState<SortOrder>("lastEdited");
  const [noteFilter, setNoteFilter] = useState<NoteFilter>("all");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const createNote = useCreateNote();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(PINNED_STORAGE_KEY) : null;
    if (stored) {
      setPinnedIds(stored.split(",").filter(Boolean));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PINNED_STORAGE_KEY, pinnedIds.join(","));
    }
  }, [pinnedIds]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchScope("all");
    }
  }, [searchQuery]);

  const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  const resolvedFolderId = selectedFolderId ?? folders[0]?.id ?? null;

  const handleCreateNote = () => {
    if (!resolvedFolderId) return;
    createNote.mutate(
      {
        title: "Untitled Note",
        content: "",
        folderId: resolvedFolderId,
      },
      {
        onSuccess: (data) => {
          if (data?.note) {
            setSelectedNote(data.note);
          }
        },
      },
    );
  };

  const sortedNotes = useMemo(() => {
    const sorted = [...notes];
    if (sortOrder === "dateCreated") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return sorted;
    }
    sorted.sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime(),
    );
    return sorted;
  }, [notes, sortOrder]);

  const filteredNotes = useMemo(() => {
    let filtered = sortedNotes;

    if (selectedFolderId) {
      filtered = filtered.filter((note) => note.folderId === selectedFolderId);
    }

    const query = deferredSearchQuery.trim();
    if (query) {
      filtered = filtered.filter((note) => {
        const titleMatches = (note.title ?? "").toLowerCase().includes(query.toLowerCase());
        const contentMatches = (note.content ?? "").toLowerCase().includes(query.toLowerCase());
        if (searchScope === "title") return titleMatches;
        if (searchScope === "content") return contentMatches;
        return titleMatches || contentMatches;
      });
    }

    return filtered;
  }, [sortedNotes, selectedFolderId, deferredSearchQuery, searchScope]);

  const applyFilter = useMemo(() => {
    if (noteFilter === "pinned") {
      return (list: Note[]) => list.filter((note) => pinnedIdSet.has(note.id));
    }
    if (noteFilter === "recent") {
      const cutoff = subDays(new Date(), 7);
      return (list: Note[]) =>
        list.filter((note) => new Date(note.updatedAt ?? note.createdAt) >= cutoff);
    }
    return (list: Note[]) => list;
  }, [noteFilter, pinnedIdSet]);

  const visibleNotes = useMemo(() => applyFilter(filteredNotes), [applyFilter, filteredNotes]);

  const pinnedNotes = useMemo(() => {
    const source = noteFilter === "all" ? filteredNotes : visibleNotes;
    return source.filter((note) => pinnedIdSet.has(note.id));
  }, [filteredNotes, noteFilter, pinnedIdSet, visibleNotes]);

  const unpinnedNotes = useMemo(() => {
    const source = noteFilter === "all" ? filteredNotes : visibleNotes;
    return source.filter((note) => !pinnedIdSet.has(note.id));
  }, [filteredNotes, noteFilter, pinnedIdSet, visibleNotes]);

  useEffect(() => {
    if (visibleNotes.length === 0) {
      setSelectedNote(null);
      return;
    }

    if (!selectedNote || !visibleNotes.some((note) => note.id === selectedNote.id)) {
      setSelectedNote(visibleNotes[0]);
    }
  }, [visibleNotes, selectedNote]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const listHeaderTitle = selectedFolder?.name ?? "All Notes";
  const noteCountLabel = visibleNotes.length === 1 ? "1 Note" : `${visibleNotes.length} Notes`;

  const togglePin = (noteId: string) => {
    setPinnedIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [noteId, ...prev],
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row bg-gradient-to-b from-[#f8f8fb] via-[#f4f4f7] to-[#efeff3] text-foreground dark:from-[#1f1f22] dark:via-[#1c1c1e] dark:to-[#1b1b1d]">
      <FolderSidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
        allNotesCount={notes.length}
      />
      <NoteList
        pinnedNotes={pinnedNotes}
        unpinnedNotes={unpinnedNotes}
        selectedNote={selectedNote}
        setSelectedNote={setSelectedNote}
        folders={folders}
        selectedFolderId={selectedFolderId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        noteFilter={noteFilter}
        setNoteFilter={setNoteFilter}
        searchScope={searchScope}
        setSearchScope={setSearchScope}
        noteCountLabel={noteCountLabel}
        listHeaderTitle={listHeaderTitle}
        pinnedIdSet={pinnedIdSet}
        onTogglePin={togglePin}
        onCreateNote={handleCreateNote}
        hasFolders={folders.length > 0}
        isCreatingNote={createNote.isPending}
      />
      <NoteDisplay note={selectedNote} folders={folders} />
    </div>
  );
}
