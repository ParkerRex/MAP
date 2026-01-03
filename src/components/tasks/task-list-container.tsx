"use client";

import { CheckSquare, ListTodo, Plus, Search, Trash2, X } from "lucide-react";
import type { FC } from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskWithTags } from "@/types";
import TaskItem from "./task-item";

type SimpleTag = { id: string; title: string };

interface TaskListContainerProps {
  filteredTasks: TaskWithTags[];
  searchQuery: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onCreateTask?: (title: string) => void;
  toggleTaskCompletion: (task: TaskWithTags) => void;
  handleDelete: (taskId: string) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => Promise<void>;
  updateTask: (taskId: string, data: { title?: string; body?: string }) => Promise<void>;
  getAllTags: () => Promise<SimpleTag[]>;
  createTag: (title: string) => Promise<SimpleTag>;
  updateTaskTags: (taskId: string, tags: string[]) => Promise<void>;
  isSelectMode: boolean;
  selectedTaskIds: Set<string>;
  toggleSelectMode: () => void;
  toggleTaskSelection: (taskId: string) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;
  handleBulkComplete: () => void;
  handleBulkDelete: () => void;
}

const TaskListContainer: FC<TaskListContainerProps> = ({
  filteredTasks,
  searchQuery,
  hasActiveFilters,
  onClearFilters,
  onCreateTask,
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
  selectAllTasks,
  clearSelection,
  handleBulkComplete,
  handleBulkDelete,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && onCreateTask) {
      onCreateTask(newTaskTitle.trim());
      setNewTaskTitle("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Select mode bar - only show when active */}
      {isSelectMode && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50 md:px-6">
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
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4">
          {/* Add task input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Add a task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="pl-9"
              />
            </div>
            {newTaskTitle.trim() && (
              <Button type="submit" size="default">
                Add
              </Button>
            )}
            {filteredTasks.length > 0 && !isSelectMode && (
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
          </form>

          {/* Task list */}
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                {searchQuery || hasActiveFilters ? (
                  <Search className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <ListTodo className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-medium">
                {searchQuery ? `No results for "${searchQuery}"` : "No tasks yet"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {searchQuery || hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "Add your first task above to get started."}
              </p>
              {(searchQuery || hasActiveFilters) && onClearFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
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
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TaskListContainer;
