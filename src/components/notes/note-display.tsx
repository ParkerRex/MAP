"use client";

import { format } from "date-fns";
import { Eye, FileText, Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
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

  // Empty state
  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">No note selected</p>
        <p className="text-sm mt-1">Select a note to view its content</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="shrink-0 border-b bg-background/50 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Input
              ref={titleInputRef}
              className="text-xl md:text-2xl font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
              placeholder="Note Title"
              value={title}
              onChange={handleTitleChange}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {format(note.updatedAt ?? note.createdAt, "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus !== "idle" && (
              <span
                className={cn(
                  "text-xs transition-opacity",
                  saveStatus === "saving" ? "text-muted-foreground" : "text-green-600",
                )}
              >
                {saveStatus === "saving" ? "Saving..." : "Saved"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="shrink-0 border-b px-4 md:px-6 py-2 flex items-center gap-1 bg-muted/30">
        <Button
          variant={isPreview ? "ghost" : "secondary"}
          size="sm"
          onClick={() => setIsPreview(false)}
          className="h-7 text-xs"
        >
          <Pencil className="h-3 w-3 mr-1.5" />
          Edit
        </Button>
        <Button
          variant={isPreview ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setIsPreview(true)}
          className="h-7 text-xs"
        >
          <Eye className="h-3 w-3 mr-1.5" />
          Preview
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <ScrollArea className="h-full">
            <div className="p-4 md:p-6">
              <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border">
                <Markdown>{content || "*Start writing to see a preview...*"}</Markdown>
              </article>
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full p-4 md:p-6">
            <Textarea
              className="w-full h-full resize-none border-none shadow-none focus-visible:ring-0 bg-transparent p-0 text-sm leading-relaxed"
              placeholder="Start typing your note... (Markdown supported)"
              value={content}
              onChange={handleContentChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
