"use client";

import { useCreateFolder, useDeleteFolder, useUpdateFolder } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { CirclePlus, Folder } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

import NoteDisplay from "@/components/notes/note-display";
import NoteList from "@/components/notes/note-list";

import type { FolderBarProps, LinkItem, Note } from "@/types";

const FilledFolder: React.FC<React.ComponentProps<LucideIcon>> = (props) => (
  <Folder {...props} fill="currentColor" fillOpacity={0.2} />
);

export default function FolderBar({ folders, notes }: FolderBarProps) {
  const [view, setView] = React.useState<"all" | "folder">("all");
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null);
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [renameFolderName, setRenameFolderName] = React.useState("");
  const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null);

  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();

  React.useEffect(() => {
    if (selectedFolderId) {
      const folderNotes = notes.filter((note) => note.folder_id === selectedFolderId);
      if (folderNotes.length > 0) {
        const mostRecentNote = folderNotes.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )[0];
        setSelectedNote(mostRecentNote);
      }
    }
  }, [selectedFolderId, notes]);

  const handleAddFolder = async () => {
    if (newFolderName.trim() === "") return;
    createFolder.mutate({ name: newFolderName });
    setNewFolderName("");
  };

  const handleRenameFolder = async (folderId: string) => {
    if (renameFolderName.trim() === "") return;
    updateFolder.mutate({ folderId, name: renameFolderName });
    setRenameFolderName("");
    setEditingFolderId(null);
  };

  const handleDeleteFolder = async (folderId: string) => {
    deleteFolderMutation.mutate(folderId);
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setView("folder");
  };

  const handleFolderKeyDown = (e: React.KeyboardEvent, folderId: string | null) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFolderSelect(folderId);
    }
  };

  const links: LinkItem[] = folders.map((folder) => ({
    id: folder.id,
    title: folder.name,
    label: folder.notesCount.toString(),
    icon: folder.name === "Coach Notes" ? FilledFolder : Folder,
    variant: "ghost",
    onClick: () => handleFolderSelect(folder.id),
    onKeyDown: (e: React.KeyboardEvent) => handleFolderKeyDown(e, folder.id),
    isSelected: selectedFolderId === folder.id,
  }));

  return (
    <div className="flex w-full">
      <div id="folders" className="flex flex-col gap-2 p-4 w-[190px]">
        <AnimatePresence initial={false}>
          {links.map((link, _index) => (
            <motion.div
              key={link.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ opacity: { duration: 0.2 } }}
            >
              <ContextMenu key={link.id}>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      "flex max-w-[200px] w-40 align-left justify-start items-center text gap-2 rounded-lg p-3 transition-all hover:bg-accent",
                      link.isSelected ? "bg-muted" : "",
                    )}
                    onClick={link.onClick}
                    onKeyDown={link.onKeyDown}
                    role="button"
                    tabIndex={0}
                    style={{ userSelect: "none" }}
                  >
                    {link.icon && <link.icon className="h-4 w-4 flex" />}
                    {editingFolderId === link.id ? (
                      <Input
                        value={renameFolderName}
                        onChange={(e) => setRenameFolderName(e.target.value)}
                        onBlur={() => handleRenameFolder(link.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameFolder(link.id);
                          }
                        }}
                        autoFocus
                        className="text-sm font-medium"
                      />
                    ) : (
                      <span className="text-sm font-medium" style={{ userSelect: "none" }}>
                        {link.title}
                      </span>
                    )}
                    {link.label && (
                      <span
                        className="ml-auto text-xs text-muted-foreground"
                        style={{ userSelect: "none" }}
                      >
                        {link.label}
                      </span>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onSelect={() => {
                      setEditingFolderId(link.id);
                      setRenameFolderName(link.title);
                    }}
                  >
                    Rename Folder
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => handleDeleteFolder(link.id)}>
                    Delete Folder
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => setNewFolderName("")}>
                    New Folder
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Sort by</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuItem>Default (Date edited)</ContextMenuItem>
                      <ContextMenuItem>Date Edited</ContextMenuItem>
                      <ContextMenuItem>Date Created</ContextMenuItem>
                      <ContextMenuItem>Title</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem>Newest First</ContextMenuItem>
                      <ContextMenuItem>Oldest First</ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuContent>
              </ContextMenu>
            </motion.div>
          ))}
        </AnimatePresence>
        <Separator className="my-2 flex w-32 max-w-[180px]" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-32 max-w-[150px]">
              <div className="flex flex-row items-center gap-2">
                <CirclePlus className="h-4 w-4" />
                <p>Add Folder</p>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2 p-4">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="flex-1"
              />
              <Button onClick={handleAddFolder} className="flex w-20 max-w-[150px]">
                Add Folder
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col w-64">
        <NoteList
          notes={notes}
          view={view}
          selectedFolderId={selectedFolderId}
          setSelectedFolderId={setSelectedFolderId}
          selectedNote={selectedNote}
          setSelectedNote={setSelectedNote}
          folders={folders}
          note={null}
        />
      </div>
      <div className="flex-grow">
        <NoteDisplay
          note={selectedNote}
          selectedFolderId={selectedFolderId}
          setSelectedNote={(note) => setSelectedNote(note as Note | null)}
        />
      </div>
    </div>
  );
}
