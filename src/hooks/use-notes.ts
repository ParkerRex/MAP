"use client";

import { useQuery } from "@tanstack/react-query";
import {
  api,
  queryKeys,
  useSimpleMutation,
  type FoldersResponse,
  type NoteResponse,
  type NotesResponse,
} from "@/lib/api";

// Notes Queries
export function useNotes() {
  return useQuery<NotesResponse>({
    queryKey: queryKeys.notes.all,
    queryFn: () => api.notes.list(),
  });
}

export function useNote(noteId: string) {
  return useQuery<NoteResponse>({
    queryKey: queryKeys.notes.detail(noteId),
    queryFn: () => api.notes.get(noteId),
    enabled: !!noteId,
  });
}

// Notes Mutations
export function useCreateNote() {
  return useSimpleMutation({
    mutationFn: (data: { title: string; content?: string; folderId: string }) =>
      api.notes.create(data),
    invalidateKeys: [queryKeys.notes.all, queryKeys.folders.all],
  });
}

export function useUpdateNote() {
  return useSimpleMutation({
    mutationFn: ({
      noteId,
      ...data
    }: {
      noteId: string;
      title?: string;
      content?: string;
      folderId?: string;
    }) => api.notes.update(noteId, data),
    invalidateKeys: [queryKeys.notes.all, queryKeys.folders.all],
  });
}

export function useDeleteNote() {
  return useSimpleMutation({
    mutationFn: (noteId: string) => api.notes.delete(noteId),
    invalidateKeys: [queryKeys.notes.all, queryKeys.folders.all],
  });
}

export function useDuplicateNote() {
  return useSimpleMutation({
    mutationFn: (noteId: string) => api.notes.duplicate(noteId),
    invalidateKeys: [queryKeys.notes.all, queryKeys.folders.all],
  });
}

// Folders Queries
export function useFolders() {
  return useQuery<FoldersResponse>({
    queryKey: queryKeys.folders.all,
    queryFn: () => api.folders.list(),
  });
}

// Folders Mutations
export function useCreateFolder() {
  return useSimpleMutation({
    mutationFn: (data: { name: string }) => api.folders.create(data),
    invalidateKeys: [queryKeys.folders.all],
  });
}

export function useUpdateFolder() {
  return useSimpleMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      api.folders.update(folderId, { name }),
    invalidateKeys: [queryKeys.folders.all],
  });
}

export function useDeleteFolder() {
  return useSimpleMutation({
    mutationFn: (folderId: string) => api.folders.delete(folderId),
    invalidateKeys: [queryKeys.folders.all, queryKeys.notes.all],
  });
}

export function useEnsureCoachNotesFolder() {
  return useSimpleMutation({
    mutationFn: () => api.folders.ensureCoachNotes(),
    invalidateKeys: [queryKeys.folders.all],
  });
}
