"use client";

import { format, isThisYear, isToday, isYesterday } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  FileText,
  FolderInput,
  Loader2,
  MoreHorizontal,
  Pencil,
  Pin,
  Search,
  Trash2,
} from "lucide-react";
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
import type { NoteFilter, SearchScope, SortOrder } from "./notes-content";

interface NoteListProps {
  pinnedNotes: Note[];
  unpinnedNotes: Note[];
  selectedNote: Note | null;
  setSelectedNote: (note: Note | null) => void;
  folders: FolderType[];
  selectedFolderId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching?: boolean;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  noteFilter: NoteFilter;
  setNoteFilter: (filter: NoteFilter) => void;
  searchScope: SearchScope;
  setSearchScope: (scope: SearchScope) => void;
  noteCountLabel: string;
  listHeaderTitle: string;
  pinnedIdSet: Set<string>;
  onTogglePin: (noteId: string) => void;
  onCreateNote: () => void;
  hasFolders: boolean;
  isCreatingNote: boolean;
}

export default function NoteList({
  pinnedNotes,
  unpinnedNotes,
  selectedNote,
  setSelectedNote,
  folders,
  selectedFolderId,
  searchQuery,
  setSearchQuery,
  isSearching = false,
  sortOrder,
  setSortOrder,
  noteFilter,
  setNoteFilter,
  searchScope,
  setSearchScope,
  noteCountLabel,
  listHeaderTitle,
  pinnedIdSet,
  onTogglePin,
  onCreateNote,
  hasFolders,
  isCreatingNote,
}: NoteListProps) {
  const deleteNote = useDeleteNote();
  const duplicateNote = useDuplicateNote();
  const updateNote = useUpdateNote();

  const sortOptions: { value: SortOrder; label: string }[] = [
    { value: "lastEdited", label: "Last Edited" },
    { value: "dateCreated", label: "Date Created" },
  ];

  const filterOptions: { value: NoteFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pinned", label: "Pinned" },
    { value: "recent", label: "Recent" },
  ];

  const scopeOptions: { value: SearchScope; label: string }[] = [
    { value: "all", label: "All" },
    { value: "title", label: "Title" },
    { value: "content", label: "Content" },
  ];

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
        <mark
          key={`hl-${index}`}
          className="bg-[#fff2bf] text-[#6b4c00] rounded px-0.5 dark:bg-[#5c4a00] dark:text-[#f7e9b0]"
        >
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
      <div className="w-full lg:w-[360px] border-b lg:border-b-0 lg:border-r border-black/10 flex flex-col bg-white dark:border-white/10 dark:bg-[#1c1c1e]">
        <div className="shrink-0 border-b border-black/10 bg-[#f7f7f9] dark:border-white/10 dark:bg-[#2c2c2e]">
          <div className="px-4 pt-5 pb-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Notes
                </p>
                <h2 className="text-xl font-semibold truncate">{listHeaderTitle}</h2>
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setSortOrder(option.value)}
                        className="flex items-center justify-between"
                      >
                        <span>{option.label}</span>
                        {sortOrder === option.value && <Check className="w-4 h-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onCreateNote}
                  disabled={isCreatingNote}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <input
                className="h-9 w-full rounded-full border border-black/10 bg-white/80 pl-9 pr-3 text-sm outline-none ring-offset-background transition focus:border-black/20 dark:border-white/10 dark:bg-[#2c2c2e] dark:text-[#f2f2f7]"
                placeholder="Search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setNoteFilter(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    noteFilter === option.value
                      ? "bg-[#fff2bf] text-[#6b4c00] dark:bg-[#3a2f12] dark:text-[#f7e9b0]"
                      : "bg-white text-muted-foreground hover:text-foreground dark:bg-[#2c2c2e] dark:text-[#b0b0b8]",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {searchQuery.trim().length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSearchScope(option.value)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                      searchScope === option.value
                        ? "bg-[#f1f1f4] text-foreground dark:bg-[#3a3a3c] dark:text-[#f2f2f7]"
                        : "bg-white text-muted-foreground dark:bg-[#2c2c2e] dark:text-[#b0b0b8]",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
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

        <div className="shrink-0 border-t border-black/10 bg-[#f7f7f9] px-4 py-2 dark:border-white/10 dark:bg-[#2c2c2e]">
          <span className="text-xs text-muted-foreground">{noteCountLabel}</span>
        </div>
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
            "group relative flex flex-col gap-1 rounded-lg px-3 py-2 cursor-pointer transition-colors",
            selectedNote?.id === note.id
              ? "bg-[#fff2bf] text-[#2d2d2d] dark:bg-[#3a2f12] dark:text-[#f7e9b0]"
              : "hover:bg-[#f2f2f7] dark:hover:bg-[#2a2a2c]",
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
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm leading-tight truncate">
                  {highlightText(note.title ?? "Untitled", searchQuery)}
                </h3>
                {isPinned && <Pin className="h-3 w-3 text-[#d39a00] shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {highlightText((note.content ?? "").replace(/\n/g, " ").trim(), searchQuery) ||
                  "No additional text"}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-muted-foreground">
                {formatTimestamp(note.updatedAt ?? note.createdAt)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          </div>
          {selectedFolderId === null && note.folderId && (
            <span className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
              {folders.find((folder) => folder.id === note.folderId)?.name ?? ""}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full lg:w-[360px] border-b lg:border-b-0 lg:border-r border-black/10 flex flex-col bg-white dark:border-white/10 dark:bg-[#1c1c1e]">
      <div className="shrink-0 border-b border-black/10 bg-[#f7f7f9] dark:border-white/10 dark:bg-[#2c2c2e]">
        <div className="px-4 pt-5 pb-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Notes
              </p>
              <h2 className="text-xl font-semibold truncate">{listHeaderTitle}</h2>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSortOrder(option.value)}
                      className="flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      {sortOrder === option.value && <Check className="w-4 h-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onCreateNote}
                disabled={isCreatingNote}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <input
              className="h-9 w-full rounded-full border border-black/10 bg-white/80 pl-9 pr-3 text-sm outline-none ring-offset-background transition focus:border-black/20 dark:border-white/10 dark:bg-[#2c2c2e] dark:text-[#f2f2f7]"
              placeholder="Search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setNoteFilter(option.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  noteFilter === option.value
                    ? "bg-[#fff2bf] text-[#6b4c00] dark:bg-[#3a2f12] dark:text-[#f7e9b0]"
                    : "bg-white text-muted-foreground hover:text-foreground dark:bg-[#2c2c2e] dark:text-[#b0b0b8]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {searchQuery.trim().length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {scopeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSearchScope(option.value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                    searchScope === option.value
                      ? "bg-[#f1f1f4] text-foreground dark:bg-[#3a3a3c] dark:text-[#f2f2f7]"
                      : "bg-white text-muted-foreground dark:bg-[#2c2c2e] dark:text-[#b0b0b8]",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
            <AnimatePresence initial={false}>
              {(noteFilter === "all" ? unpinnedNotes : listNotes).map(renderNoteCard)}
            </AnimatePresence>
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-black/10 bg-[#f7f7f9] px-4 py-2 dark:border-white/10 dark:bg-[#2c2c2e]">
        <span className="text-xs text-muted-foreground">{noteCountLabel}</span>
      </div>
    </div>
  );
}
