"use client";
import type { Tag, Task } from "@/types";
import { ScrollArea } from "@map/ui/scroll-area";
import { Reorder } from "framer-motion";
import type { FC } from "react";
import React from "react";
import { updateTaskTags } from "../../actions/tasks/taskActions";
import TaskItem from "./task-item";

interface TaskListContainerProps {
  tasks: Task[];
  filteredTasks: Task[];
  highlightedTaskId: string | null;
  selectedTask: Task | null;
  searchQuery: string;
  handleTaskClick: (task: Task) => void;
  handleTaskDoubleClick: (task: Task) => void;
  toggleTaskCompletion: (task: Task) => void;
  handleDelete: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setTasks: (tasks: Task[]) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => Promise<void>;
  getAllTags: () => Promise<Tag[]>;
  createTag: (name: string) => Promise<Tag>;
  updateTaskTags: (taskId: string, tags: string[]) => Promise<void>;
}

const TaskListContainer: FC<TaskListContainerProps> = ({
  tasks,
  filteredTasks,
  highlightedTaskId,
  selectedTask,
  searchQuery,
  handleTaskClick,
  handleTaskDoubleClick,
  toggleTaskCompletion,
  handleDelete,
  setSelectedTask,
  setTasks,
  updateTaskDueDate,
  getAllTags,
  createTag,
}) => {
  return (
    <ScrollArea className="flex-1 overflow-auto p-4 md:p-6">
      <div className="container mx-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center text-muted-foreground">
            We can't find your task!
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={filteredTasks}
            onReorder={(newOrder) => {
              const updatedTasks = tasks.map((task) => {
                const newPosition = newOrder.findIndex((t) => t.id === task.id);
                return newPosition !== -1 ? newOrder[newPosition] : task;
              });
              setTasks(updatedTasks);
            }}
            className="grid gap-2"
          >
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
          </Reorder.Group>
        )}
      </div>
    </ScrollArea>
  );
};

export default TaskListContainer;
