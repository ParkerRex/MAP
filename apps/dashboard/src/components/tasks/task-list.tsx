"use client";

import {
  useCreateTag,
  useCreateTask,
  useDeleteTag,
  useDeleteTask,
  useFetchTags,
  useFetchTasks,
  useToggleTask,
  useUpdateTag,
  useUpdateTaskDueDate,
  useUpdateTaskTags,
} from "@/actions/tasks/clientActions";
import type { Task } from "@/types";
import type { Tag as TagType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import TagFilter from "./tag-filter";
import TaskListHeader from "./task-header";
import TaskListContainer from "./task-list-container";

interface TaskListProps {
  initialTasks: Task[];
  initialTags: TagType[];
}

const TaskList: React.FC<TaskListProps> = ({ initialTasks, initialTags }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagTitle, setNewTagTitle] = useState("");
  const [isEditingTag, setIsEditingTag] = useState<string | null>(null);
  const [editTagTitle, setEditTagTitle] = useState<string>("");
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = initialTasks, refetch: refetchTasks } = useFetchTasks();
  const { data: tags = initialTags, refetch: refetchTags } = useFetchTags();

  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleTaskMutation = useToggleTask();
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();
  const updateTagMutation = useUpdateTag();
  const updateTaskDueDateMutation = useUpdateTaskDueDate();
  const updateTaskTagsMutation = useUpdateTaskTags();

  const handleCreateTag = async () => {
    if (newTagTitle.trim() === "") return;
    await createTagMutation.mutateAsync(newTagTitle);
    setNewTagTitle("");
    refetchTags();
  };

  const handleTagSelect = async (tag: string) => {
    const updatedSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updatedSelectedTags);
    console.log("Selected tags updated:", updatedSelectedTags);

    if (selectedTask?.id) {
      await updateTaskTagsMutation.mutateAsync({
        taskId: selectedTask.id,
        tags: updatedSelectedTags,
      });
      console.log(`Tags updated for task ${selectedTask.id}`);
      refetchTasks();
    }
  };

  const handleTaskSelection = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskCreated = async (formData: FormData) => {
    await createTaskMutation.mutateAsync(formData);
    refetchTasks();
  };

  const handleDeleteTag = async (tagId: string) => {
    await deleteTagMutation.mutateAsync(tagId);
    refetchTags();
  };

  const handleEditTag = (tag: TagType) => {
    setIsEditingTag(tag.id || null);
    setEditTagTitle(tag.title);
  };

  const handleSaveTag = async (tagId: string) => {
    await updateTagMutation.mutateAsync({ id: tagId, title: editTagTitle });
    setIsEditingTag(null);
    refetchTags();
  };

  const handleDelete = async (taskId: string) => {
    await deleteTaskMutation.mutateAsync(taskId);
    refetchTasks();
  };

  const handleToggle = async (task: Task) => {
    if (task.id) {
      await toggleTaskMutation.mutateAsync({
        taskId: task.id,
        completed_at: task.completed_at ? null : new Date().toISOString(),
      });
      refetchTasks();
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
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
        handleTaskCreated={handleTaskCreated}
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
        tasks={tasks}
        filteredTasks={filteredTasks}
        highlightedTaskId={null}
        selectedTask={selectedTask}
        searchQuery={searchQuery}
        handleTaskClick={handleTaskSelection}
        handleTaskDoubleClick={() => {}}
        setSelectedTask={setSelectedTask}
        setTasks={() => {}}
        handleDelete={handleDelete}
        toggleTaskCompletion={handleToggle}
        updateTaskDueDate={async (taskId, dueDate) => {
          await updateTaskDueDateMutation.mutateAsync({ taskId, dueDate });
          refetchTasks();
        }}
        getAllTags={async () => {
          const result = await refetchTags();
          return result.data || [];
        }}
        createTag={createTagMutation.mutateAsync}
        updateTaskTags={async (taskId, tags) => {
          await updateTaskTagsMutation.mutateAsync({ taskId, tags });
          refetchTasks();
        }}
      />
    </div>
  );
};

export default TaskList;
