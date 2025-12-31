"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tag } from "@/db/schema";
import {
  api,
  queryKeys,
  type TagsResponse,
  type TasksResponse,
  type TaskWithTags,
} from "@/lib/api";

export type { TaskWithTags };

// Tasks
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => api.tasks.list(),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; body?: string; dueAt?: string }) => api.tasks.create(data),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const previous = queryClient.getQueryData<TasksResponse>(queryKeys.tasks.all);

      queryClient.setQueryData<TasksResponse>(queryKeys.tasks.all, (old) => ({
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

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      ...data
    }: {
      taskId: string;
      title?: string;
      body?: string;
      dueAt?: string | null;
      completed?: boolean;
      tags?: string[];
    }) => api.tasks.update(taskId, data),
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const previous = queryClient.getQueryData<TasksResponse>(queryKeys.tasks.all);

      queryClient.setQueryData<TasksResponse>(queryKeys.tasks.all, (old) => ({
        tasks:
          old?.tasks.map((task) => {
            if (task.id !== update.taskId) return task;
            return {
              ...task,
              ...(update.title !== undefined && { title: update.title }),
              ...(update.body !== undefined && { body: update.body }),
              ...(update.dueAt !== undefined && {
                dueAt: update.dueAt ? new Date(update.dueAt) : null,
              }),
              ...(update.completed !== undefined && {
                completedAt: update.completed ? new Date() : null,
              }),
            };
          }) ?? [],
      }));

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => api.tasks.delete(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const previous = queryClient.getQueryData<TasksResponse>(queryKeys.tasks.all);

      queryClient.setQueryData<TasksResponse>(queryKeys.tasks.all, (old) => ({
        tasks: old?.tasks.filter((task) => task.id !== taskId) ?? [],
      }));

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

// Convenience wrappers
export function useToggleTask() {
  const update = useUpdateTask();
  return {
    ...update,
    mutate: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      update.mutate({ taskId, completed }),
  };
}

export function useUpdateTaskDueDate() {
  const update = useUpdateTask();
  return {
    ...update,
    mutate: ({ taskId, dueAt }: { taskId: string; dueAt: string | null }) =>
      update.mutate({ taskId, dueAt }),
  };
}

export function useUpdateTaskTags() {
  const update = useUpdateTask();
  return {
    ...update,
    mutate: ({ taskId, tags }: { taskId: string; tags: string[] }) =>
      update.mutate({ taskId, tags }),
  };
}

// Tags
export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: () => api.tags.list(),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string }) => api.tags.create(data),
    onMutate: async (newTag) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tags.all });
      const previous = queryClient.getQueryData<TagsResponse>(queryKeys.tags.all);

      queryClient.setQueryData<TagsResponse>(queryKeys.tags.all, (old) => ({
        tags: [
          ...(old?.tags ?? []),
          {
            id: `temp-${Date.now()}`,
            title: newTag.title,
            userId: null,
          } as Tag,
        ],
      }));

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tags.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, title }: { tagId: string; title: string }) =>
      api.tags.update(tagId, { title }),
    onMutate: async ({ tagId, title }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tags.all });
      const previous = queryClient.getQueryData<TagsResponse>(queryKeys.tags.all);

      queryClient.setQueryData<TagsResponse>(queryKeys.tags.all, (old) => ({
        tags: old?.tags.map((tag) => (tag.id === tagId ? { ...tag, title } : tag)) ?? [],
      }));

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tags.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => api.tags.delete(tagId),
    onMutate: async (tagId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tags.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      const previousTags = queryClient.getQueryData<TagsResponse>(queryKeys.tags.all);
      const previousTasks = queryClient.getQueryData<TasksResponse>(queryKeys.tasks.all);

      queryClient.setQueryData<TagsResponse>(queryKeys.tags.all, (old) => ({
        tags: old?.tags.filter((tag) => tag.id !== tagId) ?? [],
      }));

      queryClient.setQueryData<TasksResponse>(queryKeys.tasks.all, (old) => ({
        tasks:
          old?.tasks.map((task) => ({
            ...task,
            tags: task.tags.filter((tag) => tag.id !== tagId),
          })) ?? [],
      }));

      return { previousTags, previousTasks };
    },
    onError: (_, __, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(queryKeys.tags.all, context.previousTags);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

// Bulk operations
export function useBulkCompleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskIds: string[]) => api.tasks.bulkUpdate(taskIds, { completed: true }),
    onMutate: async (taskIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const previous = queryClient.getQueryData<TasksResponse>(queryKeys.tasks.all);

      queryClient.setQueryData<TasksResponse>(queryKeys.tasks.all, (old) => ({
        tasks:
          old?.tasks.map((task) =>
            taskIds.includes(task.id) ? { ...task, completedAt: new Date() } : task,
          ) ?? [],
      }));

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskIds: string[]) => api.tasks.bulkDelete(taskIds),
    onMutate: async (taskIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const previous = queryClient.getQueryData<TasksResponse>(queryKeys.tasks.all);

      queryClient.setQueryData<TasksResponse>(queryKeys.tasks.all, (old) => ({
        tasks: old?.tasks.filter((task) => !taskIds.includes(task.id)) ?? [],
      }));

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
