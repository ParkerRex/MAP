"use client";

import { Crosshair, Loader2, Plus, Search } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/components/ui/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaskListHeaderProps {
  viewMode: "tasks" | "projects";
  setViewMode: (mode: "tasks" | "projects") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching?: boolean;
  focusMode: boolean;
  onToggleFocus: () => void;
  onCreateProject: () => void;
}

const TaskListHeader: FC<TaskListHeaderProps> = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  isSearching = false,
  focusMode,
  onToggleFocus,
  onCreateProject,
}) => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-4 py-4 px-4 md:px-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
            <div className="inline-flex items-center rounded-full border bg-muted/40 p-1 text-sm">
              {(["tasks", "projects"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cn(
                    "px-3 py-1 rounded-full transition-colors",
                    viewMode === mode
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "tasks" ? "Tasks" : "Projects"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === "tasks" && (
              <Button
                variant={focusMode ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleFocus}
                title="Focus mode"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
            )}
            {viewMode === "projects" && (
              <Button variant="outline" size="sm" onClick={onCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                New project
              </Button>
            )}
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                className="w-[200px] md:w-[280px] pl-9 h-9"
                placeholder={viewMode === "projects" ? "Search projects..." : "Search tasks..."}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TaskListHeader;
