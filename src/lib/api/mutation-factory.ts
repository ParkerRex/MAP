import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { ApiError } from "./errors";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Include details if available
    if (error.details && typeof error.details === "object") {
      const fieldErrors = Object.entries(error.details)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(", ");
      if (fieldErrors) {
        return `${error.message} (${fieldErrors})`;
      }
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

interface SimpleMutationOptions<TData, TVariables = void> {
  mutationFn: TVariables extends void
    ? () => Promise<TData>
    : (variables: TVariables) => Promise<TData>;
  invalidateKeys: QueryKey[];
  /** Custom success message for toast */
  successMessage?: string;
  /** Custom error message prefix */
  errorMessage?: string;
  /** Disable default error toast */
  disableErrorToast?: boolean;
}

interface OptimisticMutationOptions<TData, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys: QueryKey[];
  optimistic: {
    queryKey: QueryKey;
    onMutate: (variables: TVariables) => TContext;
    onError: (context: TContext | undefined) => void;
  };
  /** Custom error message prefix */
  errorMessage?: string;
  /** Disable default error toast */
  disableErrorToast?: boolean;
}

/**
 * Factory for simple mutations that just invalidate queries on success.
 *
 * @example
 * export function useCreateFolder() {
 *   return useSimpleMutation({
 *     mutationFn: (data) => api.folders.create(data),
 *     invalidateKeys: [queryKeys.folders.all],
 *   });
 * }
 */
export function useSimpleMutation<TData, TVariables = void>(
  options: SimpleMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: options.mutationFn as (variables: TVariables) => Promise<TData>,
    onSuccess: () => {
      for (const key of options.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      if (options.successMessage) {
        toast({ description: options.successMessage });
      }
    },
    onError: (error) => {
      if (!options.disableErrorToast) {
        const message = getErrorMessage(error);
        toast({
          variant: "destructive",
          title: options.errorMessage ?? "Error",
          description: message,
        });
      }
    },
  });
}

/**
 * Factory for mutations with optimistic updates.
 *
 * @example
 * export function useDeleteTask() {
 *   return useOptimisticMutation<{ success: boolean }, string, TasksResponse | undefined>({
 *     mutationFn: (taskId) => api.tasks.delete(taskId),
 *     invalidateKeys: [queryKeys.tasks.all],
 *     optimistic: {
 *       queryKey: queryKeys.tasks.all,
 *       onMutate: (taskId) => {
 *         const previous = queryClient.getQueryData<TasksResponse>(queryKeys.tasks.all);
 *         queryClient.setQueryData<TasksResponse>(queryKeys.tasks.all, (old) => ({
 *           tasks: old?.tasks.filter((t) => t.id !== taskId) ?? [],
 *         }));
 *         return previous;
 *       },
 *       onError: (previous) => {
 *         if (previous) queryClient.setQueryData(queryKeys.tasks.all, previous);
 *       },
 *     },
 *   });
 * }
 */
export function useOptimisticMutation<TData, TVariables, TContext>(
  options: OptimisticMutationOptions<TData, TVariables, TContext>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: options.mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: options.optimistic.queryKey,
      });
      return options.optimistic.onMutate(variables);
    },
    onError: (error, _, context) => {
      options.optimistic.onError(context);
      if (!options.disableErrorToast) {
        const message = getErrorMessage(error);
        toast({
          variant: "destructive",
          title: options.errorMessage ?? "Error",
          description: message,
        });
      }
    },
    onSettled: () => {
      for (const key of options.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
