"use client";

import { format, isThisYear, isToday, isYesterday } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, FileText, FolderInput, MoreHorizontal, Pin, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeleteNote, useDuplicateNote, useUpdateNote } from "@/hooks/use-notes";
import type { FolderType, Note } from "@/types/notes";
import type { NoteFilter } from "./notes-content";

interface NoteListProps {
  pinnedNotes: Note[];
  unpinnedNotes: Note[];
  selectedNote: Note | null;
  setSelectedNote: (note: Note | null) => void;
  folders: FolderType[];
  selectedFolderId: string | null;
  searchQuery: string;
  noteFilter: NoteFilter;
  noteCountLabel: string;
  listHeaderTitle: string;
  pinnedIdSet: Set<string>;
  onTogglePin: (noteId: string) => void;
  hasFolders: boolean;
}

export default function NoteList({
  pinnedNotes,
  unpinnedNotes,
  selectedNote,
  setSelectedNote,
  folders,
  selectedFolderId,
  searchQuery,
  noteFilter,
  noteCountLabel,
  listHeaderTitle,
  pinnedIdSet,
  onTogglePin,
  hasFolders,
}: NoteListProps) {
  const deleteNote = useDeleteNote();
  const duplicateNote = useDuplicateNote();
  const updateNote = useUpdateNote();

  const listNotes =
    noteFilter === "pinned" ? pinnedNotes : [...pinnedNotes, ...unpinnedNotes];

  const handleDelete = (noteId: string) => {
    deleteNote.mutate(noteId);
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
  };

  const handleDuplicate = (noteId: string) => {
    duplicateNote.mutate(noteId);
  };

  const handleMoveToFolder = (noteId: string, folderId: string) => {
    updateNote.mutate({ noteId, folderId });
  };

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isThisYear(date)) return format(date, "MMM d");
    return format(date, "MMM d, yyyy");
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={`hl-${index}`} className="bg-yellow-200/70 dark:bg-yellow-800/60 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  if (listNotes.length === 0) {
    const emptyTitle =
      noteFilter === "pinned"
        ? "No pinned notes"
        : noteFilter === "recent"
          ? "No recent notes"
          : "No notes yet";
    const emptySubtitle =
      noteFilter === "pinned"
        ? "Pin notes for quick access"
        : noteFilter === "recent"
          ? "Notes edited in the last 7 days will appear here"
          : hasFolders
            ? "Create your first note"
            : "Create a folder to start";
    return (
      <div className="w-full lg:w-[320px] border-b lg:border-b-0 lg:border-r flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-background/60">
        {searchQuery ? (
          <>
            <Search className="h-10 w-10 mb-4 opacity-40" />
            <p className="font-medium">No notes found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </>
        ) : (
          <>
            <FileText className="h-10 w-10 mb-4 opacity-40" />
            <p className="font-medium">{emptyTitle}</p>
            <p className="text-sm mt-1">{emptySubtitle}</p>
          </>
        )}
      </div>
    );
  }

  const renderNoteCard = (note: Note) => {
    const isPinned = pinnedIdSet.has(note.id);

    return (
      <motion.div
        key={note.id}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
      >
        <div
          className={cn(
            "group relative flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all",
            selectedNote?.id === note.id
              ? "border-yellow-200 bg-yellow-100/70 dark:border-yellow-900/50 dark:bg-yellow-900/30"
              : "border-transparent bg-muted/40 hover:bg-muted/70",
          )}
          onClick={() => setSelectedNote(note)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedNote(note);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate">
                {highlightText(note.title ?? "Untitled", searchQuery)}
              </h3>
              {isPinned && <Pin className="h-3 w-3 text-yellow-500 shrink-0" />}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
                  <Pin className="h-4 w-4 mr-2" />
                  {isPinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(note.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="h-4 w-4 mr-2" />
                    Move to
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {folders
                      .filter((f) => f.id !== note.folderId)
                      .map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => handleMoveToFolder(note.id, folder.id)}
                        >
                          {folder.name}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(note.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
            <span className="font-medium">
              {formatTimestamp(note.updatedAt ?? note.createdAt)}
            </span>
            <span className="truncate">
              {highlightText((note.content ?? "").replace(/\n/g, " ").trim(), searchQuery) ||
                "No content"}
            </span>
          </div>
          {selectedFolderId === null && note.folderId && (
            <span className="text-[11px] text-muted-foreground">
              {folders.find((folder) => folder.id === note.folderId)?.name ?? ""}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full lg:w-[320px] border-b lg:border-b-0 lg:border-r flex flex-col bg-background/60">
      <ScrollArea className="flex-1">
        <div className="px-3 py-4 space-y-4">
          {noteFilter === "all" && pinnedNotes.length > 0 && (
            <section className="space-y-2">
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pinned
              </div>
              <AnimatePresence initial={false}>{pinnedNotes.map(renderNoteCard)}</AnimatePresence>
            </section>
          )}

          <section className="space-y-2">
            <div className="px-2 space-y-1">
              <p className="text-sm font-semibold text-foreground">{listHeaderTitle}</p>
              <p className="text-[11px] text-muted-foreground">{noteCountLabel}</p>
            </div>
            <AnimatePresence initial={false}>
              {(noteFilter === "all" ? unpinnedNotes : listNotes).map(renderNoteCard)}
            </AnimatePresence>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
