"use client";

import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export function useAppleHealthStatus() {
  return useQuery({
    queryKey: queryKeys.appleHealth.status,
    queryFn: () => api.appleHealth.status(),
  });
}

export function useAppleHealthSnapshot() {
  return useQuery({
    queryKey: queryKeys.appleHealth.snapshot,
    queryFn: () => api.appleHealth.snapshot(),
  });
}

export interface HealthTrend {
  percentChange: number;
  isPositive: boolean;
  label: string;
}

export function calculateTrend(
  current?: number | null,
  history?: Array<number | null | undefined>,
  higherIsBetter = true,
): HealthTrend | null {
  if (!current || current <= 0 || !history) return null;
  const valid = history.filter((value) => typeof value === "number" && value > 0) as number[];
  if (valid.length < 3) return null;

  const previous = valid.slice(0, -1).slice(-7);
  if (!previous.length) return null;

  const avg = previous.reduce((sum, value) => sum + value, 0) / previous.length;
  if (avg <= 0) return null;

  const delta = (current - avg) / avg;
  const magnitude = Math.abs(delta);

  if (magnitude < 0.02) {
    return { percentChange: 0, isPositive: true, label: "Avg" };
  }

  const percent = Math.round(magnitude * 100);
  const label = `${delta >= 0 ? "+" : "-"}${percent}%`;
  const isPositive = higherIsBetter ? delta >= 0 : delta <= 0;

  return { percentChange: delta, isPositive, label };
}

export function formatNumber(value?: number | null, suffix = "", decimals = 0) {
  if (!value || value <= 0) return "--";
  if (value >= 1000 && decimals === 0) {
    return `${(value / 1000).toFixed(1)}k${suffix}`;
  }
  return `${value.toFixed(decimals)}${suffix}`;
}

export function formatHoursMinutes(hours?: number | null) {
  if (!hours || hours <= 0) return "--";
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (wholeHours > 0) {
    return `${wholeHours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
