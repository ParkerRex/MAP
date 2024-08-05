import { toastError, toastSuccess } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTag,
  deleteTag,
  getAllTags,
  getAllTasks,
  handleCreateTask,
  handleDeleteTask,
  handleToggleTask,
  updateTag,
  updateTaskDueDate,
  updateTaskTags,
} from "./taskActions";

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: handleCreateTask,
    onSuccess: () => {
      console.log("Task created successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toastSuccess({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toastError({ title: "Error", description: "Failed to create task" });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: handleDeleteTask,
    onSuccess: () => {
      console.log("Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toastSuccess({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toastError({ title: "Error", description: "Failed to delete task" });
    },
  });
};

export const useToggleTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { taskId: string; completed_at: string | null }) =>
      handleToggleTask(params.taskId, params.completed_at),
    onSuccess: () => {
      console.log("Task status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toastSuccess({ title: "Success", description: "Task status updated" });
    },
    onError: (error) => {
      console.error("Error updating task status:", error);
      toastError({
        title: "Error",
        description: "Failed to update task status",
      });
    },
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      console.log("Tag created successfully");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toastSuccess({
        title: "Success",
        description: "Tag created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
      toastError({ title: "Error", description: "Failed to create tag" });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      console.log("Tag deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toastSuccess({
        title: "Success",
        description: "Tag deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting tag:", error);
      toastError({ title: "Error", description: "Failed to delete tag" });
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateTag(id, title),
    onSuccess: () => {
      console.log("Tag updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toastSuccess({
        title: "Success",
        description: "Tag updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating tag:", error);
      toastError({ title: "Error", description: "Failed to update tag" });
    },
  });
};

export const useUpdateTaskDueDate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, dueDate }: { taskId: string; dueDate: string }) =>
      updateTaskDueDate(taskId, dueDate),
    onSuccess: () => {
      console.log("Task due date updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toastSuccess({ title: "Success", description: "Task due date updated" });
    },
    onError: (error) => {
      console.error("Error updating task due date:", error);
      toastError({
        title: "Error",
        description: "Failed to update task due date",
      });
    },
  });
};

export const useFetchTasks = () => {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      try {
        const tasks = await getAllTasks();
        return tasks;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error; // This will be caught by react-query's error handling
      }
    },
  });
};

export const useFetchTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      try {
        const tags = await getAllTags();
        return tags;
      } catch (error) {
        console.error("Error fetching tags:", error);
        throw error; // This will be caught by react-query's error handling
      }
    },
  });
};

export const useUpdateTaskTags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, tags }: { taskId: string; tags: string[] }) =>
      updateTaskTags(taskId, tags),
    onSuccess: () => {
      console.log("Task tags updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toastSuccess({ title: "Success", description: "Task tags updated" });
    },
    onError: (error) => {
      console.error("Error updating task tags:", error);
      toastError({
        title: "Error",
        description: "Failed to update task tags",
      });
    },
  });
};
