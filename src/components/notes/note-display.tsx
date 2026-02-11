"use client";

import { format } from "date-fns";
import { Eye, Folder, Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateNote } from "@/hooks/use-notes";
import type { FolderType, Note } from "@/types/notes";

interface NoteDisplayProps {
  note: Note | null;
  folders: FolderType[];
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

export default function NoteDisplay({ note, folders }: NoteDisplayProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentAreaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isPreview, setIsPreview] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState(note?.folderId ?? "");

  const updateNote = useUpdateNote();

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setActiveFolderId(note?.folderId ?? "");
    setSaveStatus("idle");
    setIsPreview(false);
  }, [note?.id, note?.title, note?.content, note?.folderId]);

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

  const handleFolderChange = (folderId: string) => {
    if (!note) return;
    setActiveFolderId(folderId);
    updateNote.mutate({ noteId: note.id, folderId });
  };

  const insertSnippet = (snippet: string) => {
    const trimmed = content.trim();
    const updated =
      trimmed.length === 0
        ? snippet
        : content.endsWith("\n")
          ? content + snippet
          : `${content}\n${snippet}`;
    setContent(updated);
    setSaveStatus("idle");
    requestAnimationFrame(() => {
      contentAreaRef.current?.focus();
    });
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-white dark:bg-[#1c1c1e]">
        <Folder className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">No note selected</p>
        <p className="text-sm mt-1">Select a note to view its content</p>
      </div>
    );
  }

  const activeFolderName = folders.find((folder) => folder.id === activeFolderId)?.name ?? "Folder";

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-[#1c1c1e]">
      <div className="shrink-0 border-b border-black/10 bg-white/90 backdrop-blur p-4 md:p-6 dark:border-white/10 dark:bg-[#1c1c1e]/90">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-black/10 bg-white/80 px-3 dark:border-white/10 dark:bg-[#2c2c2e]"
                  disabled={folders.length === 0}
                >
                  <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                  {activeFolderName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {folders.map((folder) => (
                  <DropdownMenuItem key={folder.id} onClick={() => handleFolderChange(folder.id)}>
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Input
              ref={titleInputRef}
              className="text-3xl font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
              placeholder="Title"
              value={title}
              onChange={handleTitleChange}
            />
            <p className="text-xs text-muted-foreground">
              Last edited {format(note.updatedAt ?? note.createdAt, "MMMM d, yyyy 'at' h:mm a")}
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
            <div className="flex items-center rounded-full border border-black/10 bg-white p-0.5 dark:border-white/10 dark:bg-[#2c2c2e]">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                  !isPreview ? "bg-[#fff2bf] text-[#6b4c00]" : "text-muted-foreground",
                )}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                  isPreview ? "bg-[#fff2bf] text-[#6b4c00]" : "text-muted-foreground",
                )}
              >
                <Eye className="h-3 w-3" />
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {!isPreview && (
        <div className="shrink-0 border-b border-black/10 px-4 md:px-6 py-2 bg-[#f7f7f9] dark:border-white/10 dark:bg-[#2c2c2e]">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <MarkdownChip title="H1" onClick={() => insertSnippet("# ")} />
            <MarkdownChip title="H2" onClick={() => insertSnippet("## ")} />
            <MarkdownChip title="Bold" onClick={() => insertSnippet("**bold**")} />
            <MarkdownChip title="Italic" onClick={() => insertSnippet("*italic*")} />
            <MarkdownChip title="List" onClick={() => insertSnippet("- ")} />
            <MarkdownChip title="Checklist" onClick={() => insertSnippet("- [ ] ")} />
            <MarkdownChip title="Quote" onClick={() => insertSnippet("> ")} />
            <MarkdownChip title="Code" onClick={() => insertSnippet("`code`")} />
            <MarkdownChip title="Block" onClick={() => insertSnippet("```\ncode\n```")} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <ScrollArea className="h-full">
            <div className="p-4 md:p-6">
              <article className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-[#f2f2f7] prose-pre:border dark:prose-invert dark:prose-pre:bg-[#2c2c2e] dark:prose-pre:border-white/10">
                <Markdown>{content || "*Start writing to see a preview...*"}</Markdown>
              </article>
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full p-4 md:p-6">
            <Textarea
              ref={contentAreaRef}
              className="w-full h-full resize-none border-none shadow-none focus-visible:ring-0 bg-transparent p-0 text-[15px] leading-relaxed"
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

function MarkdownChip({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-white/90 dark:border-white/10 dark:bg-[#2c2c2e] dark:text-[#b0b0b8]"
    >
      {title}
    </button>
  );
}
