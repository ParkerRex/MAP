"use client";

import { Loader2, Search, Tag, X } from "lucide-react";
import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Tag as TagType } from "@/types";

interface TaskListHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching?: boolean;
  tags: TagType[];
  selectedTags: string[];
  handleTagSelect: (tag: string) => void;
  onClearTagFilters?: () => void;
  newTagTitle: string;
  setNewTagTitle: (title: string) => void;
  handleCreateTag: () => void;
  handleTaskCreated: (formData: FormData) => Promise<void>;
  handleDeleteTag: (tagId: string) => void;
  handleEditTag: (tag: TagType) => void;
  handleSaveTag: (tagId: string) => void;
  isEditingTag: string | null;
  editTagTitle: string;
  setEditTagTitle: (title: string) => void;
}

const TaskListHeader: FC<TaskListHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching = false,
  tags,
  selectedTags,
  handleTagSelect,
  onClearTagFilters,
  newTagTitle,
  setNewTagTitle,
  handleCreateTag,
  handleTaskCreated: _handleTaskCreated,
  handleDeleteTag,
  handleEditTag,
  handleSaveTag,
  isEditingTag,
  editTagTitle,
  setEditTagTitle,
}) => {
  return (
    <header className="flex w-full">
      <div className="flex flex-col md:flex-row gap-4 py-4 px-4 container justify-between w-full">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            )}
            <Input
              className="pl-10 pr-4 py-2 rounded-md bg-muted focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors"
              placeholder="Search tasks..."
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex items-center gap-2"
                variant={selectedTags.length > 0 ? "secondary" : "outline"}
              >
                <Tag className="w-5 h-5" />
                <span>Tags</span>
                {selectedTags.length > 0 && (
                  <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-between px-2">
                <DropdownMenuLabel className="px-0">Filter by tags</DropdownMenuLabel>
                {selectedTags.length > 0 && onClearTagFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      onClearTagFilters();
                    }}
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {tags.map((tag) => (
                <ContextMenu key={tag.id}>
                  <ContextMenuTrigger asChild>
                    {isEditingTag === tag.id ? (
                      <div className="flex items-center gap-2 px-4 py-2">
                        <Input
                          value={editTagTitle}
                          onChange={(e) => setEditTagTitle(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={() => tag.id && handleSaveTag(tag.id)}>Save</Button>
                      </div>
                    ) : (
                      <DropdownMenuCheckboxItem
                        checked={selectedTags.includes(tag.title)}
                        onCheckedChange={() => handleTagSelect(tag.title)}
                      >
                        {tag.title}
                      </DropdownMenuCheckboxItem>
                    )}
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={() => tag.id && handleDeleteTag(tag.id)}>
                      Delete Tag
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => handleEditTag(tag)}>Edit Tag</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              <DropdownMenuSeparator />
              <div className="px-4 py-2">
                <Input
                  placeholder="New tag"
                  value={newTagTitle}
                  onChange={(e) => setNewTagTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateTag();
                    }
                  }}
                />
                <Button onClick={handleCreateTag} className="mt-2">
                  Add Tag
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Show selected tags as removable chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1 pl-2 pr-1 cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TaskListHeader;
