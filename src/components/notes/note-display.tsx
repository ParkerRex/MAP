import { format } from "date-fns";
import { Eye, Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateNote } from "@/hooks/use-notes";

import type { Note } from "@/types/notes";

interface NoteDisplayProps {
  note: Note | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function NoteDisplay({ note }: NoteDisplayProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isPreview, setIsPreview] = useState(false);

  const updateNote = useUpdateNote();

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  // Sync local state when note changes
  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setSaveStatus("idle");
    setIsPreview(false);
  }, [note?.id, note?.title, note?.content]);

  // Auto-save on debounced changes
  useEffect(() => {
    if (!note) return;

    const titleChanged = debouncedTitle !== note.title;
    const contentChanged = debouncedContent !== (note.content ?? "");

    if (titleChanged || contentChanged) {
      setSaveStatus("saving");
      updateNote.mutate(
        {
          noteId: note.id,
          title: debouncedTitle || undefined,
          content: debouncedContent || undefined,
        },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          },
          onError: () => {
            setSaveStatus("idle");
          },
        },
      );
    }
  }, [debouncedTitle, debouncedContent, note, updateNote]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSaveStatus("idle");
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaveStatus("idle");
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4 shrink-0">
        {note ? (
          <>
            <div className="flex items-center gap-2">
              <Input
                ref={titleInputRef}
                className="text-2xl font-bold w-full"
                placeholder="Note Title"
                value={title}
                onChange={handleTitleChange}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && "Saved"}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {format(note.updatedAt ?? note.createdAt, "MMM d, yyyy 'at' h:mm a")}
            </span>
          </>
        ) : (
          <p className="text-center text-muted-foreground">Select a note to view its content</p>
        )}
      </div>
      {note && (
        <div className="grow overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 pb-2 border-b">
            <Button
              variant={isPreview ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setIsPreview(false)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant={isPreview ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsPreview(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            {isPreview ? (
              <ScrollArea className="h-full">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown>{content || "*No content yet*"}</Markdown>
                </div>
              </ScrollArea>
            ) : (
              <Textarea
                className="w-full h-full resize-none"
                placeholder="Start typing your note... (Markdown supported)"
                value={content}
                onChange={handleContentChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
