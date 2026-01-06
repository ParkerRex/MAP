"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Folder, FolderPlus, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCreateFolder, useDeleteFolder, useUpdateFolder } from "@/hooks/use-notes";
import type { FolderType } from "@/types/notes";

interface FolderSidebarProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  allNotesCount: number;
}

export default function FolderSidebar({
  folders,
  selectedFolderId,
  setSelectedFolderId,
  allNotesCount,
}: FolderSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      setIsCreating(false);
      return;
    }
    createFolder.mutate(
      { name: newFolderName.trim() },
      {
        onSuccess: (data) => {
          setNewFolderName("");
          setIsCreating(false);
          if (data?.folder?.id) {
            setSelectedFolderId(data.folder.id);
          }
        },
      },
    );
  };

  const handleRenameFolder = (folderId: string) => {
    if (!editFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    updateFolder.mutate(
      { folderId, name: editFolderName },
      {
        onSuccess: () => {
          setEditingFolderId(null);
          setEditFolderName("");
        },
      },
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder.mutate(folderId);
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }
  };

  const startEditing = (folder: FolderType) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
  };

  return (
    <div className="hidden md:flex flex-col w-60 border-r bg-background/70 backdrop-blur">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <div
            className={cn(
              "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
              selectedFolderId === null
                ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100"
                : "hover:bg-muted/60 dark:hover:bg-muted/80",
            )}
            onClick={() => setSelectedFolderId(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedFolderId(null);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium truncate">All Notes</span>
            <span className="text-xs text-muted-foreground tabular-nums">{allNotesCount}</span>
          </div>

          <Separator className="my-2" />

          <AnimatePresence initial={false}>
            {folders.map((folder) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                    selectedFolderId === folder.id
                      ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100"
                      : "hover:bg-muted/60 dark:hover:bg-muted/80",
                  )}
                  onClick={() => setSelectedFolderId(folder.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedFolderId(folder.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {editingFolderId === folder.id ? (
                    <Input
                      ref={inputRef}
                      value={editFolderName}
                      onChange={(e) => setEditFolderName(e.target.value)}
                      onBlur={() => handleRenameFolder(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameFolder(folder.id);
                        } else if (e.key === "Escape") {
                          setEditingFolderId(null);
                        }
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 py-0 px-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {folder.notesCount}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => startEditing(folder)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2"
            >
              <FolderPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={handleCreateFolder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  } else if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewFolderName("");
                  }
                }}
                placeholder="Folder name"
                className="h-6 py-0 px-1 text-sm"
                autoFocus
              />
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </div>
    </div>
  );
}
