"use client";

import { CheckSquare, ListTodo, Plus, Target, Trash2, X } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import type { Tag, TaskWithTags } from "@/types";
import TaskItem from "./task-item";

type TaskSection = {
  title: string;
  tintClass: string;
  tasks: TaskWithTags[];
  count?: number;
  overflowCount?: number;
};

interface TaskListContainerProps {
  sections: TaskSection[];
  searchQuery: string;
  hasActiveFilters: boolean;
  emptyState: { title: string; message: string; icon: ReactNode };
  onClearFilters: () => void;
  onCreateTask: (title: string) => void;
  newTaskTitle: string;
  setNewTaskTitle: (value: string) => void;
  quickAddTokens: string[] | null;
  tags: Tag[];
  selectedNewTaskProjectId: string | null;
  setSelectedNewTaskProjectId: (value: string | null) => void;
  toggleTaskCompletion: (task: TaskWithTags) => void;
  handleDelete: (taskId: string) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => Promise<void>;
  updateTask: (taskId: string, data: { title?: string; body?: string }) => Promise<void>;
  getAllTags: () => Promise<{ id: string; title: string }[]>;
  createTag: (title: string) => Promise<{ id: string; title: string }>;
  updateTaskTags: (taskId: string, tags: string[]) => Promise<void>;
  isSelectMode: boolean;
  selectedTaskIds: Set<string>;
  toggleSelectMode: () => void;
  toggleTaskSelection: (taskId: string) => void;
  onOpenDetail: (task: TaskWithTags) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;
  handleBulkComplete: () => void;
  handleBulkDelete: () => void;
  handleBulkAssignProject: (tagId: string | null) => void;
  handleBulkSetDueDate: (choice: "today" | "tomorrow" | "nextWeek" | "clear") => void;
  filterChips: Array<{ id: string; label: string; count: number; tint: string }>;
  selectedFilter: string;
  onSelectFilter: (id: string) => void;
  projectChips: Array<{ id: string; label: string; count: number; tint: string; color?: string }>;
  selectedProject: string;
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  focusMode: boolean;
  focusSummary: { total: number; completed: number; remaining: number };
  projectColors: Record<string, string>;
}

const TaskListContainer: FC<TaskListContainerProps> = ({
  sections,
  searchQuery,
  hasActiveFilters,
  emptyState,
  onClearFilters,
  onCreateTask,
  newTaskTitle,
  setNewTaskTitle,
  quickAddTokens,
  tags,
  selectedNewTaskProjectId,
  setSelectedNewTaskProjectId,
  toggleTaskCompletion,
  handleDelete,
  updateTaskDueDate,
  updateTask,
  getAllTags,
  createTag,
  updateTaskTags,
  isSelectMode,
  selectedTaskIds,
  toggleSelectMode,
  toggleTaskSelection,
  onOpenDetail,
  selectAllTasks,
  clearSelection,
  handleBulkComplete,
  handleBulkDelete,
  handleBulkAssignProject,
  handleBulkSetDueDate,
  filterChips,
  selectedFilter,
  onSelectFilter,
  projectChips,
  selectedProject,
  onSelectProject,
  onAddProject,
  focusMode,
  focusSummary,
  projectColors,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const selectedProjectTitle = selectedNewTaskProjectId
    ? tags.find((tag) => tag.id === selectedNewTaskProjectId)?.title
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onCreateTask(newTaskTitle.trim());
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4">
          {focusMode && (
            <div className="rounded-xl border bg-muted/40 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-semibold">Today Focus</div>
                <div className="text-xs text-muted-foreground">
                  {focusSummary.remaining} remaining
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${focusSummary.total ? (focusSummary.completed / focusSummary.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="rounded-full bg-background p-3 text-primary">
                <Target className="h-5 w-5" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <Button
                key={chip.id}
                variant={selectedFilter === chip.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSelectFilter(chip.id)}
                className={cn("gap-2", selectedFilter === chip.id && "shadow")}
              >
                <span className={cn("h-2 w-2 rounded-full", chip.tint)} />
                {chip.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {chip.count}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {projectChips.map((chip) => (
              <Button
                key={chip.id}
                variant={selectedProject === chip.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => onSelectProject(chip.id)}
                className="gap-2"
              >
                <span
                  className={cn("h-2 w-2 rounded-full", chip.tint)}
                  style={chip.color ? { background: chip.color } : undefined}
                />
                {chip.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {chip.count}
                </Badge>
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={onAddProject}>
              <Plus className="h-4 w-4 mr-1" />
              Add project
            </Button>
          </div>

          {/* Select mode bar */}
          {isSelectMode && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2">
              <Button variant="ghost" size="sm" onClick={toggleSelectMode}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button variant="ghost" size="sm" onClick={selectAllTasks}>
                Select all
              </Button>
              {selectedTaskIds.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground ml-2">
                    {selectedTaskIds.size} selected
                  </span>
                  <div className="ml-auto flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                    <Button variant="default" size="sm" onClick={handleBulkComplete}>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                    <DropdownMenu open={showBulkActions} onOpenChange={setShowBulkActions}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          Move to project
                        </div>
                        <DropdownMenuItem onClick={() => handleBulkAssignProject(null)}>
                          No project
                        </DropdownMenuItem>
                        {tags.map((tag) => (
                          <DropdownMenuItem
                            key={tag.id}
                            onClick={() => handleBulkAssignProject(tag.id)}
                          >
                            {tag.title}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1 text-xs text-muted-foreground">Set due date</div>
                        <DropdownMenuItem onClick={() => handleBulkSetDueDate("today")}>
                          Today
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkSetDueDate("tomorrow")}>
                          Tomorrow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkSetDueDate("nextWeek")}>
                          Next week
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkSetDueDate("clear")}>
                          Clear
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add task input */}
          {!isSelectMode && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem onClick={() => setSelectedNewTaskProjectId(null)}>
                      No project
                    </DropdownMenuItem>
                    {tags.map((tag) => (
                      <DropdownMenuItem
                        key={tag.id}
                        onClick={() => setSelectedNewTaskProjectId(tag.id)}
                      >
                        {tag.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    placeholder="Add a task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="pl-3"
                  />
                </div>
                {selectedProjectTitle && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {selectedProjectTitle}
                  </span>
                )}
                {newTaskTitle.trim() && (
                  <Button type="submit" size="default">
                    Add
                  </Button>
                )}
                {sections.length > 0 && !isSelectMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={toggleSelectMode}
                    title="Select multiple"
                  >
                    <ListTodo className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {quickAddTokens && newTaskTitle.trim() && (
                <div className="flex flex-wrap gap-2">
                  {quickAddTokens.map((token) => (
                    <span
                      key={token}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              )}
            </form>
          )}

          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">{emptyState.icon}</div>
              <h3 className="text-lg font-medium">{emptyState.title}</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyState.message}</p>
              {(searchQuery || hasActiveFilters) && (
                <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", section.tintClass)} />
                    <span>{section.title}</span>
                    {section.count !== undefined && <span>· {section.count}</span>}
                  </div>
                  <div className="space-y-2">
                    {section.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        toggleTaskCompletion={toggleTaskCompletion}
                        handleDelete={handleDelete}
                        updateTaskDueDate={updateTaskDueDate}
                        updateTask={updateTask}
                        getAllTags={getAllTags}
                        createTag={createTag}
                        updateTaskTags={updateTaskTags}
                        isSelectMode={isSelectMode}
                        isSelected={selectedTaskIds.has(task.id)}
                        onToggleSelect={() => toggleTaskSelection(task.id)}
                        onOpenDetail={onOpenDetail}
                        projectColors={projectColors}
                      />
                    ))}
                    {section.overflowCount && section.overflowCount > 0 && (
                      <div className="text-xs text-muted-foreground text-center py-2">
                        {section.overflowCount} more completed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TaskListContainer;
