import type { Note } from "@/types/notes";
import { useEffect, useState } from "react";

export function useSelectedNote(notes: Note[]) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (notes.length > 0) {
      // Select the most recently edited note
      const mostRecentNote = notes.reduce((latest, note) => {
        return new Date(note.updated_at) > new Date(latest.updated_at)
          ? note
          : latest;
      }, notes[0]);
      setSelectedNote(mostRecentNote);
    }
  }, [notes]);

  return [selectedNote, setSelectedNote] as const;
}
