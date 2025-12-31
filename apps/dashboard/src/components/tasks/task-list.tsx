"use client";

import {
  useCreateTag,
  useCreateTask,
  useDeleteTag,
  useDeleteTask,
  useTags,
  useToggleTask,
  useUpdateTag,
  useUpdateTaskDueDate,
  useUpdateTaskTags,
} from "@/hooks/use-tasks";
import type { Task } from "@/types";
import type { Tag as TagType } from "@/types";
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [tasks, setTasks] = useState(initialTasks);
  const [tags, setTags] = useState(initialTags);

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const toggleTask = useToggleTask();
  const createTag = useCreateTag();
  const deleteTagMutation = useDeleteTag();
  const updateTag = useUpdateTag();
  const updateTaskDueDate = useUpdateTaskDueDate();
  const updateTaskTags = useUpdateTaskTags();
  const { refetch: refetchTags } = useTags();

  const handleCreateTask = async (formData: FormData) => {
    const title = formData.get("title") as string;
    if (!title) return;
    createTask.mutate({ title });
  };

  const handleDeleteTask = async (taskId: string) => {
    deleteTask.mutate(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleToggleTask = async (task: Task) => {
    const newCompleted = !task.completedAt;
    toggleTask.mutate({ taskId: task.id, completed: newCompleted });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, completedAt: newCompleted ? new Date().toISOString() : null }
          : t
      )
    );
  };

  const handleCreateTag = async () => {
    if (!newTagTitle.trim()) return;
    createTag.mutate({ title: newTagTitle });
    setNewTagTitle("");
  };

  const handleDeleteTag = async (tagId: string) => {
    deleteTagMutation.mutate(tagId);
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleUpdateTag = async (tagId: string, newTitle: string) => {
    updateTag.mutate({ tagId, title: newTitle });
    setTags((prev) =>
      prev.map((t) => (t.id === tagId ? { ...t, title: newTitle } : t))
    );
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

  const handleTaskSelection = (task: Task) => {
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
        tasks={tasks}
        filteredTasks={filteredTasks}
        highlightedTaskId={null}
        selectedTask={selectedTask}
        searchQuery={searchQuery}
        handleTaskClick={handleTaskSelection}
        handleTaskDoubleClick={() => {}}
        setSelectedTask={setSelectedTask}
        setTasks={setTasks}
        handleDelete={handleDeleteTask}
        toggleTaskCompletion={handleToggleTask}
        updateTaskDueDate={handleUpdateTaskDueDate}
        getAllTags={async () => {
          const result = await refetchTags();
          return result.data?.tags ?? [];
        }}
        createTag={handleCreateTag}
        updateTaskTags={handleUpdateTaskTags}
      />
    </div>
  );
};

export default TaskList;
