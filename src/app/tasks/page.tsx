"use client";

import TaskList from "@/components/tasks/task-list";
import { useTags, useTasks } from "@/hooks/use-tasks";

export default function ListsPage() {
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: tagsData, isLoading: tagsLoading } = useTags();

  if (tasksLoading || tagsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading...
      </div>
    );
  }

  const tasks = tasksData?.tasks ?? [];
  const tags = tagsData?.tags ?? [];

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <TaskList initialTasks={tasks} initialTags={tags} />
    </div>
  );
}
