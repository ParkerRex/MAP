import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

interface SimpleMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys: QueryKey[];
}

interface OptimisticMutationOptions<TData, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys: QueryKey[];
  optimistic: {
    queryKey: QueryKey;
    onMutate: (variables: TVariables) => TContext;
    onError: (context: TContext | undefined) => void;
  };
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
export function useSimpleMutation<TData, TVariables>(
  options: SimpleMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: () => {
      for (const key of options.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
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
    onError: (_, __, context) => {
      options.optimistic.onError(context);
    },
    onSettled: () => {
      for (const key of options.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
