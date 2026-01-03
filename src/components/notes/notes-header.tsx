"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarClock,
  CalendarPlus,
  Check,
  Loader2,
  Plus,
  Search,
  SortAsc,
} from "lucide-react";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCreateNote } from "@/hooks/use-notes";
import type { FolderType } from "@/types/notes";
import type { SortField, SortOrder } from "./notes-content";

interface NotesHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching?: boolean;
  selectedFolder: FolderType | null;
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  selectedFolderId: string | null;
}

const NotesHeader: FC<NotesHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching = false,
  selectedFolder,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  selectedFolderId,
}) => {
  const createNote = useCreateNote();

  const handleNewNote = () => {
    if (!selectedFolderId) return;
    createNote.mutate({
      title: "Untitled Note",
      content: "",
      folderId: selectedFolderId,
    });
  };

  const sortOptions: { field: SortField; label: string; icon: typeof CalendarClock }[] = [
    { field: "updatedAt", label: "Date Modified", icon: CalendarClock },
    { field: "createdAt", label: "Date Created", icon: CalendarPlus },
    { field: "title", label: "Title", icon: ArrowDownAZ },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-4 py-4 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
            {selectedFolder && (
              <span className="text-muted-foreground text-sm">/ {selectedFolder.name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                className="w-[200px] md:w-[280px] pl-9 h-9"
                placeholder="Search notes..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SortAsc className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.field}
                    onClick={() => setSortField(option.field)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </span>
                    {sortField === option.field && <Check className="w-4 h-4" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSortOrder("desc")}
                  className="flex items-center justify-between"
                >
                  <span>Newest First</span>
                  {sortOrder === "desc" && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortOrder("asc")}
                  className="flex items-center justify-between"
                >
                  <span>Oldest First</span>
                  {sortOrder === "asc" && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New Note */}
            <Button
              size="sm"
              className="h-9"
              onClick={handleNewNote}
              disabled={!selectedFolderId || createNote.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NotesHeader;
