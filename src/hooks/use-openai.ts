"use client";

import { useQuery } from "@tanstack/react-query";
import { api, queryKeys, useSimpleMutation } from "@/lib/api";

export function useOpenAIStatus() {
  return useQuery({
    queryKey: queryKeys.openai.status,
    queryFn: () => api.openai.status(),
  });
}

export function useOpenAIConnect() {
  return useSimpleMutation({
    mutationFn: (apiKey: string) => api.openai.setKey(apiKey),
    invalidateKeys: [queryKeys.openai.all],
  });
}

export function useOpenAIDisconnect() {
  return useSimpleMutation({
    mutationFn: () => api.openai.disconnect(),
    invalidateKeys: [queryKeys.openai.all],
  });
}
