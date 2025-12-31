"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Folder, Note } from "@/db/schema";

interface NotesResponse {
  notes: Note[];
}

interface NoteResponse {
  note: Note;
}

interface FoldersResponse {
  folders: (Folder & { notesCount: number })[];
}

interface FolderResponse {
  folder: Folder;
}

// Notes Queries
export function useNotes() {
  return useQuery<NotesResponse>({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await fetch("/api/notes");
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    },
  });
}

export function useNote(noteId: string) {
  return useQuery<NoteResponse>({
    queryKey: ["notes", noteId],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${noteId}`);
      if (!response.ok) throw new Error("Failed to fetch note");
      return response.json();
    },
    enabled: !!noteId,
  });
}

// Notes Mutations
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation<NoteResponse, Error, { title: string; content?: string; folderId: string }>({
    mutationFn: async (data) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation<
    NoteResponse,
    Error,
    { noteId: string; title?: string; content?: string; folderId?: string }
  >({
    mutationFn: async ({ noteId, ...data }) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (noteId) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDuplicateNote() {
  const queryClient = useQueryClient();

  return useMutation<NoteResponse, Error, string>({
    mutationFn: async (noteId) => {
      const response = await fetch(`/api/notes/${noteId}/duplicate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to duplicate note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

// Folders Queries
export function useFolders() {
  return useQuery<FoldersResponse>({
    queryKey: ["folders"],
    queryFn: async () => {
      const response = await fetch("/api/folders");
      if (!response.ok) throw new Error("Failed to fetch folders");
      return response.json();
    },
  });
}

// Folders Mutations
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation<FolderResponse, Error, { name: string }>({
    mutationFn: async (data) => {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation<FolderResponse, Error, { folderId: string; name: string }>({
    mutationFn: async ({ folderId, name }) => {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to update folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (folderId) => {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useEnsureCoachNotesFolder() {
  const queryClient = useQueryClient();

  return useMutation<FolderResponse, Error>({
    mutationFn: async () => {
      const response = await fetch("/api/folders/coach-notes", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to ensure coach notes folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}
