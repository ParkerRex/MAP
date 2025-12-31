"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, Tag } from "@/db/schema";

interface TaskWithTags extends Task {
  tags: { id: string; title: string }[];
}

interface TasksResponse {
  tasks: TaskWithTags[];
}

interface TaskResponse {
  task: Task;
}

interface TagsResponse {
  tags: Tag[];
}

interface TagResponse {
  tag: Tag;
}

// Tasks Queries
export function useTasks() {
  return useQuery<TasksResponse>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });
}

// Tasks Mutations
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<TaskResponse, Error, { title: string; body?: string; dueAt?: string }>({
    mutationFn: async (data) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<TaskResponse, Error, { taskId: string; title?: string; body?: string; dueAt?: string | null; completed?: boolean; tags?: string[] }>({
    mutationFn: async ({ taskId, ...data }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation<TaskResponse, Error, { taskId: string; completed: boolean }>({
    mutationFn: async ({ taskId, completed }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("Failed to toggle task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTaskDueDate() {
  const queryClient = useQueryClient();

  return useMutation<TaskResponse, Error, { taskId: string; dueAt: string | null }>({
    mutationFn: async ({ taskId, dueAt }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueAt }),
      });
      if (!response.ok) throw new Error("Failed to update task due date");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTaskTags() {
  const queryClient = useQueryClient();

  return useMutation<TaskResponse, Error, { taskId: string; tags: string[] }>({
    mutationFn: async ({ taskId, tags }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (!response.ok) throw new Error("Failed to update task tags");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Tags Queries
export function useTags() {
  return useQuery<TagsResponse>({
    queryKey: ["tags"],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
