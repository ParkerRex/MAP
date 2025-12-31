"use client";

import type { Note } from "@/types/notes";
import { Button } from "@map/ui/button";
import { cn } from "@map/ui/cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@map/ui/context-menu";
import { Input } from "@map/ui/input";
import { ScrollArea } from "@map/ui/scroll-area";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash } from "lucide-react";
import { Leaf, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addNoteToFolder,
  deleteNote,
  duplicateNote,
  moveNoteToFolder,
} from "../../actions/notes/note-actions";

interface NoteListProps {
  notes: Note[];
  note: Note | null;
  view: "all" | "shared" | "folder";
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  selectedNote: Note | null;
  setSelectedNote: (note: Note | null) => void;
  folders: any[];
  userId: string;
}

export default function NoteList({
  notes = [],
  view,
  userId,
  selectedFolderId,
  selectedNote,
  setSelectedNote,
  folders,
}: NoteListProps) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [searchQuery, setSearchQuery] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let filtered = localNotes;
    switch (view) {
      case "shared":
        filtered = localNotes.filter((note) => note.shared);
        break;
      case "folder":
        filtered = localNotes.filter((note) => note.folder_id === selectedFolderId);
        break;
      default:
        filtered = localNotes;
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return filtered.sort(
      (a, b) => parseISO(b.updated_at).getTime() - parseISO(a.updated_at).getTime(),
    );
  }, [localNotes, view, selectedFolderId, searchQuery]);

  const handleMoveNote = async (noteId: string, newFolderId: string) => {
    const movedNote = await moveNoteToFolder(noteId, newFolderId);
    setLocalNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    setSelectedNote(null);
  };

  const handleNewNote = async () => {
    if (!selectedFolderId || !userId) return;
    const newNote = await addNoteToFolder(
      "Brand New Note",
      "Start writing your content here...",
      userId,
      selectedFolderId,
    );
    setSelectedNote(newNote[0]);
  };

  const handleDuplicateNote = async (note: Note) => {
    const duplicatedNote = await duplicateNote(note);
    setSelectedNote(duplicatedNote[0]);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    setLocalNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    setSelectedNote(null);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={`highlight-${index}-${part}`} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const formatTimestamp = (date: string) => {
    const noteDate = parseISO(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - noteDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return "Just now";
    }
    if (diffInMinutes < 60) {
      return formatDistanceToNow(noteDate, { addSuffix: true });
    }
    if (diffInMinutes < 24 * 60) {
      return formatDistanceToNow(noteDate, { addSuffix: true });
    }
    if (diffInMinutes < 7 * 24 * 60) {
      return formatDistanceToNow(noteDate, { addSuffix: true });
    }
    return format(noteDate, "MMM d");
  };

  return (
    <>
      <div className="flex justify-between">
        <Button variant="ghost" size="icon" onClick={handleNewNote}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteNote(selectedNote?.id || "")}
          disabled={!selectedNote}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      <div
        id="searchbar"
        className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-64"
      >
        <form>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Update search query
            />
          </div>
        </form>
      </div>
      <ScrollArea className="h-screen max-w-[350px] min-w-[160px]">
        <div className="flex flex-col gap-2 p-4 pt-0">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Leaf className="h-8 w-8 mb-2" />
              <p>You've got no notes</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ opacity: { duration: 0.2 } }}
                >
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <button
                        type="button"
                        className={cn(
                          "flex flex-col items-start w-[240px] max-w-[300px] gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                          selectedNote?.id === note.id && "bg-muted",
                        )}
                        onClick={() => setSelectedNote(note)}
                        style={{ userSelect: "none" }}
                      >
                        <div className="flex w-full flex-col gap-1">
                          <div className="flex items-center">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold" style={{ userSelect: "none" }}>
                                {highlightText(note.title, searchQuery)}
                              </div>
                              <div
                                className={cn(
                                  "ml-auto text-xs",
                                  selectedNote?.id === note.id
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                                )}
                                style={{ userSelect: "none" }}
                              >
                                {formatTimestamp(note.updated_at)}
                              </div>
                            </div>
                          </div>
                          <div
                            className="line-clamp-2 text-xs text-muted-foreground"
                            style={{ userSelect: "none" }}
                          >
                            {highlightText(note.content.substring(0, 300), searchQuery)}
                          </div>
                        </div>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={handleNewNote}>New Note</ContextMenuItem>
                      <ContextMenuItem onSelect={() => handleDuplicateNote(note)}>
                        Duplicate Note
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => handleDeleteNote(note.id)}>
                        Delete Note
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Move to Folder</ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          {folders.map((folder) => (
                            <ContextMenuItem
                              key={folder.id}
                              onSelect={() => handleMoveNote(note.id, folder.id)}
                            >
                              {folder.name}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    </ContextMenuContent>
                  </ContextMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
