"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useFolders, useNotes } from "@/hooks/use-notes";
import type { FolderType, Note } from "@/types/notes";
import FolderSidebar from "./folder-sidebar";
import NoteDisplay from "./note-display";
import NoteList from "./note-list";
import NotesHeader from "./notes-header";

export type SortField = "updatedAt" | "createdAt" | "title";
export type SortOrder = "desc" | "asc";

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
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Auto-select first folder if none selected
  useEffect(() => {
    if (!selectedFolderId && folders.length > 0) {
      setSelectedFolderId(folders[0].id);
    }
  }, [selectedFolderId, folders]);

  // Auto-select most recent note when folder changes
  useEffect(() => {
    if (selectedFolderId) {
      const folderNotes = notes.filter((note) => note.folderId === selectedFolderId);
      if (folderNotes.length > 0) {
        const mostRecentNote = folderNotes.sort(
          (a, b) =>
            new Date(b.updatedAt ?? b.createdAt).getTime() -
            new Date(a.updatedAt ?? a.createdAt).getTime(),
        )[0];
        setSelectedNote(mostRecentNote);
      } else {
        setSelectedNote(null);
      }
    }
  }, [selectedFolderId, notes]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by folder
    if (selectedFolderId) {
      filtered = filtered.filter((note) => note.folderId === selectedFolderId);
    }

    // Filter by search
    if (deferredSearchQuery) {
      filtered = filtered.filter(
        (note) =>
          (note.title?.toLowerCase() ?? "").includes(deferredSearchQuery.toLowerCase()) ||
          (note.content?.toLowerCase() ?? "").includes(deferredSearchQuery.toLowerCase()),
      );
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === "title") {
        const titleA = (a.title ?? "").toLowerCase();
        const titleB = (b.title ?? "").toLowerCase();
        comparison = titleA.localeCompare(titleB);
      } else if (sortField === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        comparison =
          new Date(a.updatedAt ?? a.createdAt).getTime() -
          new Date(b.updatedAt ?? b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [notes, selectedFolderId, deferredSearchQuery, sortField, sortOrder]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="flex flex-col h-full">
      <NotesHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        selectedFolder={selectedFolder ?? null}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedFolderId={selectedFolderId}
      />
      <div className="flex flex-1 overflow-hidden">
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          setSelectedFolderId={setSelectedFolderId}
        />
        <NoteList
          notes={filteredNotes}
          selectedNote={selectedNote}
          setSelectedNote={setSelectedNote}
          folders={folders}
          selectedFolderId={selectedFolderId}
          searchQuery={deferredSearchQuery}
        />
        <NoteDisplay note={selectedNote} />
      </div>
    </div>
  );
}
