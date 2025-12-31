"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { TaskListSkeleton } from "@/components/skeletons/task-list-skeleton";
import TaskList from "@/components/tasks/task-list";
import { useTags, useTasks } from "@/hooks/use-tasks";

function TasksContent() {
  const { isLoading: tasksLoading } = useTasks();
  const { isLoading: tagsLoading } = useTags();

  if (tasksLoading || tagsLoading) {
    return <TaskListSkeleton />;
  }

  return <TaskList />;
}

export default function TasksPage() {
  return (
    <div className="flex flex-col h-full">
      <ErrorBoundary>
        <TasksContent />
      </ErrorBoundary>
    </div>
  );
}
