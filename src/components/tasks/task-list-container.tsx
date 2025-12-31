"use client";
import type { FC } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskWithTags } from "@/types";
import TaskItem from "./task-item";

type SimpleTag = { id: string; title: string };

interface TaskListContainerProps {
  filteredTasks: TaskWithTags[];
  highlightedTaskId: string | null;
  selectedTask: TaskWithTags | null;
  searchQuery: string;
  handleTaskClick: (task: TaskWithTags) => void;
  handleTaskDoubleClick: (task: TaskWithTags) => void;
  toggleTaskCompletion: (task: TaskWithTags) => void;
  handleDelete: (taskId: string) => void;
  setSelectedTask: (task: TaskWithTags | null) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => Promise<void>;
  getAllTags: () => Promise<SimpleTag[]>;
  createTag: (title: string) => Promise<SimpleTag>;
  updateTaskTags: (taskId: string, tags: string[]) => Promise<void>;
}

const TaskListContainer: FC<TaskListContainerProps> = ({
  filteredTasks,
  highlightedTaskId,
  selectedTask,
  searchQuery,
  handleTaskClick,
  handleTaskDoubleClick,
  toggleTaskCompletion,
  handleDelete,
  setSelectedTask,
  updateTaskDueDate,
  getAllTags,
  createTag,
  updateTaskTags,
}) => {
  return (
    <ScrollArea className="flex-1 overflow-auto p-4 md:p-6">
      <div className="container mx-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center text-muted-foreground">We can&apos;t find your task!</div>
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
                getAllTags={getAllTags}
                createTag={createTag}
                updateTaskTags={updateTaskTags}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default TaskListContainer;
