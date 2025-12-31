"use client";

import { useQuery } from "@tanstack/react-query";
import { api, queryKeys, useSimpleMutation } from "@/lib/api";

export function useClaudeStatus() {
  return useQuery({
    queryKey: queryKeys.claude.status,
    queryFn: () => api.claude.status(),
  });
}

export function useClaudeDisconnect() {
  return useSimpleMutation({
    mutationFn: () => api.claude.disconnect(),
    invalidateKeys: [queryKeys.claude.all],
  });
}

export function useClaudeConnect() {
  return {
    connect: () => {
      window.location.href = "/api/claude/auth";
    },
  };
}
