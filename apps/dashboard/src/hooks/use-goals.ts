"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Goal } from "@/db/schema";

interface GoalsResponse {
  goals: Goal[];
}

interface GoalResponse {
  goal: Goal;
}

interface GoalStatsResponse {
  stats: {
    total: number;
    completed: number;
    completionPercentage: number;
  };
}

// Goals Queries
export function useGoals() {
  return useQuery<GoalsResponse>({
    queryKey: ["goals"],
    queryFn: async () => {
      const response = await fetch("/api/goals");
      if (!response.ok) throw new Error("Failed to fetch goals");
      return response.json();
    },
  });
}

export function useGoalStats() {
  return useQuery<GoalStatsResponse>({
    queryKey: ["goals", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/goals/stats");
      if (!response.ok) throw new Error("Failed to fetch goal stats");
      return response.json();
    },
  });
}

// Goals Mutations
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation<GoalResponse, Error, { title: string; dueAt?: string }>({
    mutationFn: async (data) => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation<GoalResponse, Error, { goalId: string; title?: string; dueAt?: string; completed?: boolean }>({
    mutationFn: async ({ goalId, ...data }) => {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useToggleGoal() {
  const queryClient = useQueryClient();

  return useMutation<GoalResponse, Error, { goalId: string; completed: boolean }>({
    mutationFn: async ({ goalId, completed }) => {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("Failed to toggle goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (goalId) => {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteAllGoals() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error>({
    mutationFn: async () => {
      const response = await fetch("/api/goals", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete all goals");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
