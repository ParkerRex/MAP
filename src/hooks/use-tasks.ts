"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tag } from "@/db/schema";
import {
  api,
  queryKeys,
  type TaskWithTags,
  type TasksResponse,
  type TaskResponse,
  type TagsResponse,
  type TagResponse,
} from "@/lib/api";

// Re-export for backwards compatibility
export const taskQueryKeys = {
  all: queryKeys.tasks.all,
  detail: queryKeys.tasks.detail,
  tags: queryKeys.tags,
};

// Re-export types for backwards compatibility
export type { TaskWithTags };

// Update input type - consolidated for all task updates
export interface TaskUpdateInput {
  taskId: string;
  title?: string;
  body?: string;
  dueAt?: string | null;
  completed?: boolean;
  tags?: string[];
}

// Tasks Queries
export function useTasks() {
  return useQuery<TasksResponse>({
    queryKey: queryKeys.tasks.all,
    queryFn: () => api.tasks.list(),
  });
}

// Tasks Mutations
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<
    TaskResponse,
    Error,
    { title: string; body?: string; dueAt?: string }
  >({
    mutationFn: async (data) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<TasksResponse>(
        taskQueryKeys.all,
      );

      // Optimistically add the new task
      queryClient.setQueryData<TasksResponse>(taskQueryKeys.all, (old) => ({
        tasks: [
          ...(old?.tasks ?? []),
          {
            id: `temp-${Date.now()}`,
            title: newTask.title,
            body: newTask.body ?? null,
            dueAt: newTask.dueAt ? new Date(newTask.dueAt) : null,
            completedAt: null,
            completedBy: null,
            createdAt: new Date(),
            createdBy: "",
            updatedAt: new Date(),
            updatedBy: "",
            taskStatus: "pending",
            taskPosition: null,
            headerId: null,
            projectId: null,
            assignedTo: null,
            deletedAt: null,
            deletedBy: null,
            blockedBy: null,
            contactId: null,
            scheduledFor: null,
            result: null,
            actualDuration: null,
            estimatedDuration: null,
            tags: [],
          } as TaskWithTags,
        ],
      }));

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskQueryKeys.all, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

/**
 * Consolidated update hook - handles all task updates including:
 * - title/body updates
 * - due date updates
 * - completion toggle
 * - tags updates
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<TaskResponse, Error, TaskUpdateInput>({
    mutationFn: async ({ taskId, ...data }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });

      const previousTasks = queryClient.getQueryData<TasksResponse>(
        taskQueryKeys.all,
      );

      queryClient.setQueryData<TasksResponse>(taskQueryKeys.all, (old) => ({
        tasks:
          old?.tasks.map((task) => {
            if (task.id !== update.taskId) return task;

            const updatedTask = { ...task };

            if (update.title !== undefined) updatedTask.title = update.title;
            if (update.body !== undefined) updatedTask.body = update.body;
            if (update.dueAt !== undefined) {
              updatedTask.dueAt = update.dueAt ? new Date(update.dueAt) : null;
            }
            if (update.completed !== undefined) {
              updatedTask.completedAt = update.completed ? new Date() : null;
            }
            // Note: tags update is more complex, we optimistically update if we have tag data
            // The server will return the actual tags

            return updatedTask;
          }) ?? [],
      }));

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskQueryKeys.all, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (taskId) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      return response.json();
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });

      const previousTasks = queryClient.getQueryData<TasksResponse>(
        taskQueryKeys.all,
      );

      queryClient.setQueryData<TasksResponse>(taskQueryKeys.all, (old) => ({
        tasks: old?.tasks.filter((task) => task.id !== taskId) ?? [],
      }));

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskQueryKeys.all, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

// Convenience hooks that wrap useUpdateTask for backwards compatibility
// These are thin wrappers that make the API cleaner for specific use cases

export function useToggleTask() {
  const updateTask = useUpdateTask();

  return {
    ...updateTask,
    mutate: ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      updateTask.mutate({ taskId, completed });
    },
    mutateAsync: ({
      taskId,
      completed,
    }: {
      taskId: string;
      completed: boolean;
    }) => {
      return updateTask.mutateAsync({ taskId, completed });
    },
  };
}

export function useUpdateTaskDueDate() {
  const updateTask = useUpdateTask();

  return {
    ...updateTask,
    mutate: ({ taskId, dueAt }: { taskId: string; dueAt: string | null }) => {
      updateTask.mutate({ taskId, dueAt });
    },
    mutateAsync: ({
      taskId,
      dueAt,
    }: {
      taskId: string;
      dueAt: string | null;
    }) => {
      return updateTask.mutateAsync({ taskId, dueAt });
    },
  };
}

export function useUpdateTaskTags() {
  const updateTask = useUpdateTask();

  return {
    ...updateTask,
    mutate: ({ taskId, tags }: { taskId: string; tags: string[] }) => {
      updateTask.mutate({ taskId, tags });
    },
    mutateAsync: ({ taskId, tags }: { taskId: string; tags: string[] }) => {
      return updateTask.mutateAsync({ taskId, tags });
    },
  };
}

// Tags Queries
export function useTags() {
  return useQuery<TagsResponse>({
    queryKey: taskQueryKeys.tags.all,
    queryFn: async () => {
      const response = await fetch("/api/tags");
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    },
  });
}

// Tags Mutations
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation<TagResponse, Error, { title: string }>({
    mutationFn: async (data) => {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create tag");
      return response.json();
    },
    onMutate: async (newTag) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.tags.all });

      const previousTags = queryClient.getQueryData<TagsResponse>(
        taskQueryKeys.tags.all,
      );

      queryClient.setQueryData<TagsResponse>(taskQueryKeys.tags.all, (old) => ({
        tags: [
          ...(old?.tags ?? []),
          {
            id: `temp-${Date.now()}`,
            title: newTag.title,
            userId: null,
          } as Tag,
        ],
      }));

      return { previousTags };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(taskQueryKeys.tags.all, context.previousTags);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.tags.all });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation<TagResponse, Error, { tagId: string; title: string }>({
    mutationFn: async ({ tagId, title }) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to update tag");
      return response.json();
    },
    onMutate: async ({ tagId, title }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.tags.all });

      const previousTags = queryClient.getQueryData<TagsResponse>(
        taskQueryKeys.tags.all,
      );

      queryClient.setQueryData<TagsResponse>(taskQueryKeys.tags.all, (old) => ({
        tags:
          old?.tags.map((tag) =>
            tag.id === tagId ? { ...tag, title } : tag,
          ) ?? [],
      }));

      return { previousTags };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(taskQueryKeys.tags.all, context.previousTags);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.tags.all });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (tagId) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete tag");
      return response.json();
    },
    onMutate: async (tagId) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.tags.all });
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });

      const previousTags = queryClient.getQueryData<TagsResponse>(
        taskQueryKeys.tags.all,
      );
      const previousTasks = queryClient.getQueryData<TasksResponse>(
        taskQueryKeys.all,
      );

      queryClient.setQueryData<TagsResponse>(taskQueryKeys.tags.all, (old) => ({
        tags: old?.tags.filter((tag) => tag.id !== tagId) ?? [],
      }));

      // Also remove tag from all tasks
      queryClient.setQueryData<TasksResponse>(taskQueryKeys.all, (old) => ({
        tasks:
          old?.tasks.map((task) => ({
            ...task,
            tags: task.tags.filter((tag) => tag.id !== tagId),
          })) ?? [],
      }));

      return { previousTags, previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(taskQueryKeys.tags.all, context.previousTags);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(taskQueryKeys.all, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.tags.all });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}
