"use client";
import TaskForm from "@/app/lists/TaskForm";
import { Button } from "@map/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@map/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@map/ui/dropdown-menu";
import { Input } from "@map/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@map/ui/popover";
import type { Tag as TagType } from "@/types";
import { Plus, Search, Tag } from "lucide-react";
import React from "react";
import type { FC } from "react";

interface TaskListHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tags: TagType[];
  selectedTags: string[];
  handleTagSelect: (tag: string) => void;
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
  tags,
  selectedTags,
  handleTagSelect,
  newTagTitle,
  setNewTagTitle,
  handleCreateTag,
  handleTaskCreated,
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              className="pl-10 pr-4 py-2 rounded-md bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors"
              placeholder="Search tasks..."
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2" variant="outline">
                <Tag className="w-5 h-5" />
                <span>Tags</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
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
                        <Button onClick={() => tag.id && handleSaveTag(tag.id)}>
                          Save
                        </Button>
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
                    <ContextMenuItem
                      onSelect={() => tag.id && handleDeleteTag(tag.id)}
                    >
                      Delete Tag
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => handleEditTag(tag)}>
                      Edit Tag
                    </ContextMenuItem>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button className="flex items-center gap-2" variant="outline">
                <Plus className="w-5 h-5" />
                <span>New Task</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <TaskForm onSubmit={handleTaskCreated} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};

export default TaskListHeader;
