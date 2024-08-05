"use client";

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

  // TODO: Implement server action: createTask in dashboard/actions/tasks/create-task.ts
  const handleCreateTask = async (formData: FormData) => {
    // Implement create task logic
  };

  // TODO: Implement server action: deleteTask in dashboard/actions/tasks/delete-task.ts
  const handleDeleteTask = async (taskId: string) => {
    // Implement delete task logic
  };

  // TODO: Implement server action: toggleTask in dashboard/actions/tasks/toggle-task.ts
  const handleToggleTask = async (task: Task) => {
    // Implement toggle task logic
  };

  // TODO: Implement server action: createTag in dashboard/actions/tasks/create-tag.ts
  const handleCreateTag = async () => {
    // Implement create tag logic
  };

  // TODO: Implement server action: deleteTag in dashboard/actions/tasks/delete-tag.ts
  const handleDeleteTag = async (tagId: string) => {
    // Implement delete tag logic
  };

  // TODO: Implement server action: updateTag in dashboard/actions/tasks/update-tag.ts
  const handleUpdateTag = async (tagId: string, newTitle: string) => {
    // Implement update tag logic
  };

  // TODO: Implement server action: updateTaskDueDate in dashboard/actions/tasks/update-task-due-date.ts
  const handleUpdateTaskDueDate = async (taskId: string, dueDate: string) => {
    // Implement update task due date logic
  };

  // TODO: Implement server action: updateTaskTags in dashboard/actions/tasks/update-task-tags.ts
  const handleUpdateTaskTags = async (taskId: string, tags: string[]) => {
    // Implement update task tags logic
  };

  const handleTagSelect = async (tag: string) => {
    const updatedSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updatedSelectedTags);
    console.log("Selected tags updated:", updatedSelectedTags);

    if (selectedTask?.id) {
      await handleUpdateTaskTags(selectedTask.id, updatedSelectedTags);
      console.log(`Tags updated for task ${selectedTask.id}`);
      // TODO: Implement server action: fetchTasks in dashboard/actions/tasks/fetch-tasks.ts
      // Refresh tasks after updating
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
    // TODO: Implement server action: fetchTags in dashboard/actions/tasks/fetch-tags.ts
    // Refresh tags after updating
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
          // TODO: Implement server action: fetchTags in dashboard/actions/tasks/fetch-tags.ts
          // Fetch and return tags
          return [];
        }}
        createTag={handleCreateTag}
        updateTaskTags={handleUpdateTaskTags}
      />
    </div>
  );
};

export default TaskList;
