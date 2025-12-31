"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useWhoopProfile() {
  return useQuery({
    queryKey: queryKeys.whoop.profile,
    queryFn: () => api.whoop.profile(),
  });
}

export function useWhoopRecovery() {
  return useQuery({
    queryKey: queryKeys.whoop.recovery,
    queryFn: () => api.whoop.recovery(),
  });
}

export function useWhoopCycles(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.whoop.cycles(startDate, endDate),
    queryFn: () => api.whoop.cycles(startDate, endDate, 30),
  });
}

export function useWhoopSleep(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.whoop.sleep(startDate, endDate),
    queryFn: () => api.whoop.sleep(startDate, endDate, 30),
  });
}

export function useWhoopWorkouts(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.whoop.workouts(startDate, endDate),
    queryFn: () => api.whoop.workouts(startDate, endDate, 30),
  });
}

export function useWhoopSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.whoop.sync(),
    onSuccess: () => {
      // Invalidate all WHOOP queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.whoop.all });
    },
  });
}

export function useWhoopDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.whoop.disconnect(),
    onSuccess: () => {
      // Invalidate all WHOOP queries
      queryClient.invalidateQueries({ queryKey: queryKeys.whoop.all });
    },
  });
}

// Helper functions for formatting WHOOP data
export function formatRecoveryScore(score?: number | null): string {
  if (score === null || score === undefined) return "--";
  return `${score}%`;
}

export function formatStrain(strain?: string | null): string {
  if (!strain) return "--";
  const value = parseFloat(strain);
  return value.toFixed(1);
}

export function formatHrv(hrv?: string | null): string {
  if (!hrv) return "--";
  const value = parseFloat(hrv);
  return `${Math.round(value)} ms`;
}

export function formatRestingHeartRate(rhr?: string | null): string {
  if (!rhr) return "--";
  const value = parseFloat(rhr);
  return `${Math.round(value)} bpm`;
}

export function formatSleepDuration(milliseconds?: number | null): string {
  if (!milliseconds) return "--";
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function formatSleepPerformance(percentage?: string | null): string {
  if (!percentage) return "--";
  const value = parseFloat(percentage);
  return `${Math.round(value)}%`;
}

export function getRecoveryColor(score?: number | null): string {
  if (score === null || score === undefined) return "text-gray-400";
  if (score >= 67) return "text-green-500";
  if (score >= 34) return "text-yellow-500";
  return "text-red-500";
}

export function getStrainColor(strain?: string | null): string {
  if (!strain) return "text-gray-400";
  const value = parseFloat(strain);
  if (value >= 18) return "text-red-500";
  if (value >= 14) return "text-orange-500";
  if (value >= 10) return "text-yellow-500";
  return "text-blue-500";
}
