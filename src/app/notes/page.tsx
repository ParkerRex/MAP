"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { NotesContent } from "@/components/notes/notes-content";
import { NotesSkeleton } from "@/components/skeletons/notes-skeleton";
import { useFolders, useNotes } from "@/hooks/use-notes";

function NotesLoader() {
  const { isLoading: notesLoading } = useNotes();
  const { isLoading: foldersLoading } = useFolders();

  if (notesLoading || foldersLoading) {
    return <NotesSkeleton />;
  }

  return <NotesContent />;
}

export default function NotesPage() {
  return (
    <div className="flex flex-col h-full">
      <ErrorBoundary>
        <NotesLoader />
      </ErrorBoundary>
    </div>
  );
}
