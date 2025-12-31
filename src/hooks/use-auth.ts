"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type AuthUser, api, queryKeys } from "@/lib/api";

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isError: boolean;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.auth.me(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    user: data?.user ?? null,
    isLoading,
    isError,
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    isLoggingOut: logoutMutation.isPending,
  };
}
