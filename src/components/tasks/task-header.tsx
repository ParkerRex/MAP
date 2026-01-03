"use client";

import { Filter, Loader2, Search, X } from "lucide-react";
import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
}

const TaskListHeader: FC<TaskListHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching = false,
  tags,
  selectedTags,
  handleTagSelect,
  onClearTagFilters,
}) => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-4 py-4 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
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
                placeholder="Search tasks..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tag Filter */}
            {tags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={selectedTags.length > 0 ? "secondary" : "outline"}
                    size="sm"
                    className="h-9"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {selectedTags.length > 0 && (
                      <Badge variant="default" className="ml-2 h-5 px-1.5 text-xs">
                        {selectedTags.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {selectedTags.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 text-xs font-normal"
                        onClick={(e) => {
                          e.preventDefault();
                          onClearTagFilters?.();
                        }}
                      >
                        <X className="w-3 h-3 mr-2" />
                        Clear filters
                      </Button>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {tags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={selectedTags.includes(tag.title)}
                      onCheckedChange={() => handleTagSelect(tag.title)}
                    >
                      {tag.title}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Selected tag chips */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
    </header>
  );
};

export default TaskListHeader;
