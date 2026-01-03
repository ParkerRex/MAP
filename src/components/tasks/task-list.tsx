"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  useBulkCompleteTasks,
  useBulkDeleteTasks,
  useCreateTag,
  useCreateTask,
  useDeleteTask,
  useTags,
  useTasks,
  useToggleTask,
  useUpdateTask,
  useUpdateTaskDueDate,
  useUpdateTaskTags,
} from "@/hooks/use-tasks";
import type { TaskWithTags } from "@/types";
import TaskListHeader from "./task-header";
import TaskListContainer from "./task-list-container";

const TaskList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearching = searchQuery !== deferredSearchQuery;
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const { data: tasksData } = useTasks();
  const { data: tagsData } = useTags();

  const tasks = tasksData?.tasks ?? [];
  const tags = tagsData?.tags ?? [];

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const toggleTask = useToggleTask();
  const createTag = useCreateTag();
  const updateTask = useUpdateTask();
  const updateTaskDueDate = useUpdateTaskDueDate();
  const updateTaskTags = useUpdateTaskTags();
  const bulkComplete = useBulkCompleteTasks();
  const bulkDelete = useBulkDeleteTasks();

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const handleToggleTask = (task: TaskWithTags) => {
    toggleTask.mutate({ taskId: task.id, completed: !task.completedAt });
  };

  const handleCreateTagForTask = async (title: string): Promise<{ id: string; title: string }> => {
    return new Promise((resolve) => {
      createTag.mutate(
        { title },
        {
          onSuccess: (data) => {
            resolve({ id: data.tag.id, title: data.tag.title });
          },
        },
      );
    });
  };

  const handleUpdateTaskDueDate = async (taskId: string, dueDate: string) => {
    updateTaskDueDate.mutate({ taskId, dueAt: dueDate || null });
  };

  const handleUpdateTaskTags = async (taskId: string, tagIds: string[]) => {
    updateTaskTags.mutate({ taskId, tags: tagIds });
  };

  const handleUpdateTask = async (taskId: string, data: { title?: string; body?: string }) => {
    updateTask.mutate({ taskId, ...data });
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedTaskIds(new Set());
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const selectAllTasks = () => {
    setSelectedTaskIds(new Set(filteredTasks.map((t) => t.id)));
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  const handleBulkComplete = () => {
    bulkComplete.mutate(Array.from(selectedTaskIds));
    setSelectedTaskIds(new Set());
    setIsSelectMode(false);
  };

  const handleBulkDelete = () => {
    bulkDelete.mutate(Array.from(selectedTaskIds));
    setSelectedTaskIds(new Set());
    setIsSelectMode(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(deferredSearchQuery.toLowerCase());
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => task.tags?.some((t) => t.title === tag));
      return matchesSearch && matchesTags;
    });
  }, [tasks, deferredSearchQuery, selectedTags]);

  const hasActiveFilters = searchQuery.length > 0 || selectedTags.length > 0;

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  const handleClearTagFilters = () => {
    setSelectedTags([]);
  };

  const handleCreateTaskFromInput = (title: string) => {
    createTask.mutate({ title });
  };

  const getAllTags = useCallback(
    async () => tags.map((t) => ({ id: t.id, title: t.title })),
    [tags],
  );

  return (
    <div className="flex flex-col h-full">
      <TaskListHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        tags={tags}
        selectedTags={selectedTags}
        handleTagSelect={handleTagSelect}
        onClearTagFilters={handleClearTagFilters}
      />
      <TaskListContainer
        filteredTasks={filteredTasks}
        searchQuery={searchQuery}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onCreateTask={handleCreateTaskFromInput}
        toggleTaskCompletion={handleToggleTask}
        handleDelete={handleDeleteTask}
        updateTaskDueDate={handleUpdateTaskDueDate}
        updateTask={handleUpdateTask}
        getAllTags={getAllTags}
        createTag={handleCreateTagForTask}
        updateTaskTags={handleUpdateTaskTags}
        isSelectMode={isSelectMode}
        selectedTaskIds={selectedTaskIds}
        toggleSelectMode={toggleSelectMode}
        toggleTaskSelection={toggleTaskSelection}
        selectAllTasks={selectAllTasks}
        clearSelection={clearSelection}
        handleBulkComplete={handleBulkComplete}
        handleBulkDelete={handleBulkDelete}
      />
    </div>
  );
};

export default TaskList;
