"use client";
import { CheckSquare, ListChecks, Plus, Search, Trash2, X } from "lucide-react";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskWithTags } from "@/types";
import TaskItem from "./task-item";

type SimpleTag = { id: string; title: string };

interface TaskListContainerProps {
  filteredTasks: TaskWithTags[];
  highlightedTaskId: string | null;
  selectedTask: TaskWithTags | null;
  searchQuery: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onCreateTask?: (title: string) => void;
  handleTaskClick: (task: TaskWithTags) => void;
  handleTaskDoubleClick: (task: TaskWithTags) => void;
  toggleTaskCompletion: (task: TaskWithTags) => void;
  handleDelete: (taskId: string) => void;
  setSelectedTask: (task: TaskWithTags | null) => void;
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
  highlightedTaskId,
  selectedTask,
  searchQuery,
  hasActiveFilters,
  onClearFilters,
  onCreateTask,
  handleTaskClick,
  handleTaskDoubleClick,
  toggleTaskCompletion,
  handleDelete,
  setSelectedTask,
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
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b md:px-6">
        <Button variant={isSelectMode ? "secondary" : "ghost"} size="sm" onClick={toggleSelectMode}>
          <ListChecks className="h-4 w-4 mr-2" />
          {isSelectMode ? "Cancel" : "Select"}
        </Button>
        {isSelectMode && (
          <>
            <Button variant="ghost" size="sm" onClick={selectAllTasks}>
              Select All
            </Button>
            {selectedTaskIds.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedTaskIds.size} selected
                </span>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <X className="h-4 w-4 mr-1" />
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
          </>
        )}
      </div>
      <ScrollArea className="flex-1 overflow-auto p-4 md:p-6">
        <div className="container mx-auto">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">
                {searchQuery ? `No results for "${searchQuery}"` : "No tasks found"}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {searchQuery || hasActiveFilters
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Create your first task to get started."}
              </p>
              <div className="mt-4 flex gap-2">
                {(searchQuery || hasActiveFilters) && onClearFilters && (
                  <Button variant="outline" size="sm" onClick={onClearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear filters
                  </Button>
                )}
                {searchQuery && onCreateTask && (
                  <Button size="sm" onClick={() => onCreateTask(searchQuery)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create "{searchQuery}"
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  highlightedTaskId={highlightedTaskId}
                  selectedTask={selectedTask}
                  searchQuery={searchQuery}
                  handleTaskClick={handleTaskClick}
                  handleTaskDoubleClick={handleTaskDoubleClick}
                  toggleTaskCompletion={toggleTaskCompletion}
                  handleDelete={handleDelete}
                  setSelectedTask={setSelectedTask}
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
