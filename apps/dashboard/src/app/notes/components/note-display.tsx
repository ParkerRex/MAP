import { Input } from "@map/ui/input";
import { Textarea } from "@map/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateNote } from "../actions";
import {
  formatForDisplay,
  safeParseDate,
} from "@/app/calendar/utils/dateUtils";
import { DateTime } from "luxon";

import type { Note } from "@/types/notes";

interface NoteDisplayProps {
  note: Note | null;
  selectedFolderId: string | null;
  setSelectedNote: (note: Note | null) => void;
  userId: string;
}

export default function NoteDisplay({
  note,
  selectedFolderId,
  setSelectedNote,
  userId,
}: NoteDisplayProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [showEdited, setShowEdited] = useState(true);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const updateNoteMutation = useMutation({
    mutationFn: (data: { id: string; title: string; content: string }) =>
      updateNote(data.id, { title: data.title, content: data.content }),
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: ["notes", newNote.id] });
      const previousNote = queryClient.getQueryData<Note>([
        "notes",
        newNote.id,
      ]);
      queryClient.setQueryData<Note>(["notes", newNote.id], (old) => {
        if (!old) return old;
        return {
          ...old,
          ...newNote,
        };
      });
      return { previousNote };
    },
    onError: (err, newNote, context) => {
      queryClient.setQueryData(["notes", newNote.id], context?.previousNote);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes", variables.id] });
    },
  });

  const debouncedUpdateNote = useCallback(
    debounce((id: string, title: string, content: string) => {
      updateNoteMutation.mutate({ id, title, content });
    }, 500),
    [],
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (note) {
      debouncedUpdateNote(note.id, newTitle, content);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (note) {
      debouncedUpdateNote(note.id, title, newContent);
    }
  };

  const formatDate = (dateString: string) => {
    const dateTime = safeParseDate(dateString);
    if (dateTime.isValid) {
      return formatForDisplay(
        dateTime.toJSDate(),
        "MMMM d, yyyy 'at' h:mm:ss a",
      );
    }
    console.error("Error parsing date:", dateString);
    return "Invalid date";
  };

  const toggleDateDisplay = () => {
    setShowEdited(!showEdited);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4 flex-shrink-0">
        {note ? (
          <>
            <Input
              ref={titleInputRef}
              value={title}
              onChange={handleTitleChange}
              className="text-2xl font-bold w-full"
              placeholder="Note Title"
            />
            <button
              type="button"
              className="text-sm text-muted-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={toggleDateDisplay}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  toggleDateDisplay();
                }
              }}
              tabIndex={0}
            >
              {showEdited
                ? `Edited: ${formatDate(note.updated_at)}`
                : `Created: ${formatDate(note.created_at)}`}
            </button>
          </>
        ) : (
          <p className="text-center text-muted-foreground">
            Select a note to view its content
          </p>
        )}
      </div>
      {note && (
        <div className="flex-grow overflow-hidden p-4">
          <Textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-full resize-none"
            placeholder="Start typing your note..."
          />
        </div>
      )}
      {updateNoteMutation.status === "pending" && (
        <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-md">
          Saving...
        </div>
      )}
      {updateNoteMutation.status === "error" && (
        <div className="absolute bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded-md">
          Error saving note
        </div>
      )}
    </div>
  );
}
