"use client";

import { useMemo, useState } from "react";
import {
  useCreateTag,
  useCreateTask,
  useDeleteTag,
  useDeleteTask,
  useTags,
  useTasks,
  useToggleTask,
  useUpdateTag,
  useUpdateTaskDueDate,
  useUpdateTaskTags,
} from "@/hooks/use-tasks";
import type { Tag as TagType, TaskWithTags } from "@/types";
import TagFilter from "./tag-filter";
import TaskListHeader from "./task-header";
import TaskListContainer from "./task-list-container";

const TaskList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagTitle, setNewTagTitle] = useState("");
  const [isEditingTag, setIsEditingTag] = useState<string | null>(null);
  const [editTagTitle, setEditTagTitle] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null);

  // Use TanStack Query directly - no local state copy
  const { data: tasksData } = useTasks();
  const { data: tagsData } = useTags();

  const tasks = tasksData?.tasks ?? [];
  const tags = tagsData?.tags ?? [];

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const toggleTask = useToggleTask();
  const createTag = useCreateTag();
  const deleteTagMutation = useDeleteTag();
  const updateTag = useUpdateTag();
  const updateTaskDueDate = useUpdateTaskDueDate();
  const updateTaskTags = useUpdateTaskTags();

  const handleCreateTask = async (formData: FormData) => {
    const title = formData.get("title") as string;
    if (!title) return;
    createTask.mutate({ title });
  };

  const handleDeleteTask = async (taskId: string) => {
    deleteTask.mutate(taskId);
    // No manual state update - TanStack Query invalidates cache on success
  };

  const handleToggleTask = async (task: TaskWithTags) => {
    const newCompleted = !task.completedAt;
    toggleTask.mutate({ taskId: task.id, completed: newCompleted });
  };

  const handleCreateTag = async () => {
    if (!newTagTitle.trim()) return;
    createTag.mutate({ title: newTagTitle });
    setNewTagTitle("");
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

  const handleDeleteTag = async (tagId: string) => {
    deleteTagMutation.mutate(tagId);
    // No manual state update - TanStack Query invalidates cache on success
  };

  const handleUpdateTag = async (tagId: string, newTitle: string) => {
    updateTag.mutate({ tagId, title: newTitle });
    // No manual state update - TanStack Query invalidates cache on success
  };

  const handleUpdateTaskDueDate = async (taskId: string, dueDate: string) => {
    updateTaskDueDate.mutate({ taskId, dueAt: dueDate || null });
  };

  const handleUpdateTaskTags = async (taskId: string, tagIds: string[]) => {
    updateTaskTags.mutate({ taskId, tags: tagIds });
  };

  const handleTagSelect = async (tag: string) => {
    const updatedSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updatedSelectedTags);

    if (selectedTask?.id) {
      await handleUpdateTaskTags(selectedTask.id, updatedSelectedTags);
    }
  };

  const handleTaskSelection = (task: TaskWithTags) => {
    setSelectedTask(task);
  };

  const handleEditTag = (tag: TagType) => {
    setIsEditingTag(tag.id || null);
    setEditTagTitle(tag.title);
  };

  const handleSaveTag = async (tagId: string) => {
    await handleUpdateTag(tagId, editTagTitle);
    setIsEditingTag(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => task.tags?.some((t) => t.title === tag));
      return matchesSearch && matchesTags;
    });
  }, [tasks, searchQuery, selectedTags]);

  return (
    <div className="flex flex-col h-full">
      <TaskListHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleTaskCreated={handleCreateTask}
        tags={tags}
        selectedTags={selectedTags}
        handleTagSelect={handleTagSelect}
        newTagTitle={newTagTitle}
        setNewTagTitle={setNewTagTitle}
        handleCreateTag={handleCreateTag}
        handleDeleteTag={handleDeleteTag}
        handleEditTag={handleEditTag}
        handleSaveTag={handleSaveTag}
        isEditingTag={isEditingTag}
        editTagTitle={editTagTitle}
        setEditTagTitle={setEditTagTitle}
      />
      <TagFilter
        tags={tags}
        selectedTags={selectedTags}
        handleTagSelect={handleTagSelect}
        taskId={selectedTask?.id}
      />
      <TaskListContainer
        filteredTasks={filteredTasks}
        highlightedTaskId={null}
        selectedTask={selectedTask}
        searchQuery={searchQuery}
        handleTaskClick={handleTaskSelection}
        handleTaskDoubleClick={() => {}}
        setSelectedTask={setSelectedTask}
        handleDelete={handleDeleteTask}
        toggleTaskCompletion={handleToggleTask}
        updateTaskDueDate={handleUpdateTaskDueDate}
        getAllTags={async () => tags.map((t) => ({ id: t.id, title: t.title }))}
        createTag={handleCreateTagForTask}
        updateTaskTags={handleUpdateTaskTags}
      />
    </div>
  );
};

export default TaskList;
