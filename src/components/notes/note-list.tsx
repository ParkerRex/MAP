"use client";

import { format, formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, FileText, FolderInput, MoreHorizontal, Search, Trash2 } from "lucide-react";
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

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  setSelectedNote: (note: Note | null) => void;
  folders: FolderType[];
  selectedFolderId: string | null;
  searchQuery: string;
}

export default function NoteList({
  notes,
  selectedNote,
  setSelectedNote,
  folders,
  selectedFolderId,
  searchQuery,
}: NoteListProps) {
  const deleteNote = useDeleteNote();
  const duplicateNote = useDuplicateNote();
  const updateNote = useUpdateNote();

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
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60 * 24) return formatDistanceToNow(date, { addSuffix: true });
    if (diffInMinutes < 60 * 24 * 7) return formatDistanceToNow(date, { addSuffix: true });
    return format(date, "MMM d");
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={`hl-${index}`} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // Empty state
  if (notes.length === 0) {
    return (
      <div className="w-72 border-r flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        {searchQuery ? (
          <>
            <Search className="h-10 w-10 mb-4 opacity-40" />
            <p className="font-medium">No notes found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </>
        ) : selectedFolderId ? (
          <>
            <FileText className="h-10 w-10 mb-4 opacity-40" />
            <p className="font-medium">No notes yet</p>
            <p className="text-sm mt-1">Create your first note</p>
          </>
        ) : (
          <>
            <FileText className="h-10 w-10 mb-4 opacity-40" />
            <p className="font-medium">Select a folder</p>
            <p className="text-sm mt-1">Choose a folder to view notes</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-72 border-r flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence initial={false}>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className={cn(
                    "group relative flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-colors",
                    selectedNote?.id === note.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/50",
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
                    <h3 className="font-medium text-sm leading-tight line-clamp-1">
                      {highlightText(note.title ?? "Untitled", searchQuery)}
                    </h3>
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
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {highlightText((note.content ?? "").substring(0, 150), searchQuery) ||
                      "No content"}
                  </p>
                  <span className="text-xs text-muted-foreground/70">
                    {formatTimestamp(note.updatedAt ?? note.createdAt)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
