"use client";

import { useQuery } from "@tanstack/react-query";
import { api, queryKeys, useSimpleMutation } from "@/lib/api";

export function useGitHubStatus() {
  return useQuery({
    queryKey: queryKeys.github.status,
    queryFn: () => api.github.status(),
  });
}

export function useGitHubActivity() {
  return useQuery({
    queryKey: queryKeys.github.activity,
    queryFn: () => api.github.activity(),
  });
}

export function useGitHubDisconnect() {
  return useSimpleMutation({
    mutationFn: () => api.github.disconnect(),
    invalidateKeys: [queryKeys.github.all, queryKeys.auth.me],
  });
}
