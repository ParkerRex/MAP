import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { Note } from "@/types/notes";

interface NoteDisplayProps {
  note: Note | null;
  selectedFolderId: string | null;
  setSelectedNote: (note: Note | null) => void;
}

export default function NoteDisplay({
  note,
  selectedFolderId: _selectedFolderId,
  setSelectedNote: _setSelectedNote,
}: NoteDisplayProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  // TODO: Implement server actions for CRUD operations
  // 1. Create note
  // 2. Read note
  // 3. Update note title
  // 4. Update note content
  // 5. Delete note

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4 shrink-0">
        {note ? (
          <>
            <Input
              ref={titleInputRef}
              className="text-2xl font-bold w-full"
              placeholder="Note Title"
            />
            <button
              type="button"
              className="text-sm text-muted-foreground hover:underline focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              tabIndex={0}
            >
              Date placeholder
            </button>
          </>
        ) : (
          <p className="text-center text-muted-foreground">Select a note to view its content</p>
        )}
      </div>
      {note && (
        <div className="grow overflow-hidden p-4">
          <Textarea className="w-full h-full resize-none" placeholder="Start typing your note..." />
        </div>
      )}
    </div>
  );
}
