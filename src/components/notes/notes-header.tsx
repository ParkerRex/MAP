"use client";

import { Check, Folder, Loader2, MoreHorizontal, Search } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCreateFolder } from "@/hooks/use-notes";
import type { FolderType } from "@/types/notes";
import type { NoteFilter, SearchScope, SortOrder } from "./notes-content";

interface NotesHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching?: boolean;
  selectedFolder: FolderType | null;
  setSelectedFolderId: (id: string | null) => void;
  folders: FolderType[];
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  noteFilter: NoteFilter;
  setNoteFilter: (filter: NoteFilter) => void;
  searchScope: SearchScope;
  setSearchScope: (scope: SearchScope) => void;
}

const NotesHeader: FC<NotesHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching = false,
  selectedFolder,
  setSelectedFolderId,
  folders,
  sortOrder,
  setSortOrder,
  noteFilter,
  setNoteFilter,
  searchScope,
  setSearchScope,
}) => {
  const createFolder = useCreateFolder();
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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

  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    createFolder.mutate(
      { name: trimmed },
      {
        onSuccess: (data) => {
          setNewFolderName("");
          setIsFolderDialogOpen(false);
          if (data?.folder?.id) {
            setSelectedFolderId(data.folder.id);
          }
        },
      },
    );
  };

  return (
    <header className="border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex flex-col gap-4 py-5 px-4 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Notes</h1>
            <p className="text-sm text-muted-foreground">
              {selectedFolder?.name ?? "All Notes"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-5 w-5" />
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 rounded-full px-4 text-sm font-medium"
              >
                <Folder className="h-4 w-4 mr-2" />
                {selectedFolder?.name ?? "All Notes"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setSelectedFolderId(null)}>
                All Notes
              </DropdownMenuItem>
              {folders.length > 0 && <DropdownMenuSeparator />}
              {folders.map((folder) => (
                <DropdownMenuItem key={folder.id} onClick={() => setSelectedFolderId(folder.id)}>
                  {folder.name} ({folder.notesCount})
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsFolderDialogOpen(true)}>
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative flex-1 min-w-[200px]">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <Input
              className="w-full pl-9 h-9 rounded-full"
              placeholder="Search notes"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border-t bg-muted/30">
        <div className="flex flex-col gap-2 px-4 md:px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setNoteFilter(option.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  noteFilter === option.value
                    ? "bg-yellow-200/80 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100"
                    : "bg-background/70 text-muted-foreground hover:text-foreground dark:bg-background/30"
                }`}
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
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    searchScope === option.value
                      ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100"
                      : "bg-background/60 text-muted-foreground dark:bg-background/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateFolder();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsFolderDialogOpen(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolder.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default NotesHeader;
