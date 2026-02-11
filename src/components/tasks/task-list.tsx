"use client";

import { addDays, isToday, nextMonday } from "date-fns";
import { Calendar, CheckCircle2, Filter, ListTodo, Search, Sun } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  useBulkCompleteTasks,
  useBulkDeleteTasks,
  useCreateTag,
  useCreateTask,
  useDeleteTag,
  useDeleteTask,
  useTags,
  useTasks,
  useToggleTask,
  useUpdateTag,
  useUpdateTask,
  useUpdateTaskDueDate,
  useUpdateTaskTags,
} from "@/hooks/use-tasks";
import type { TaskWithTags } from "@/types";
import { getProjectColor, loadProjectColors } from "./project-colors";
import ProjectsList from "./projects-list";
import TaskDetailDialog from "./task-detail-dialog";
import TaskListHeader from "./task-header";
import TaskListContainer from "./task-list-container";
import {
  getStartOfToday,
  isTaskOverdue,
  isTaskToday,
  isTaskUpcoming,
  parseQuickAdd,
  quickAddSummary,
} from "./task-utils";

type TaskFilter = "all" | "today" | "upcoming" | "overdue" | "completed";
type ProjectFilter = "all" | "none" | `tag:${string}`;

const TaskList: React.FC = () => {
  const [viewMode, setViewMode] = useState<"tasks" | "projects">("tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearching = searchQuery !== deferredSearchQuery;
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>("all");
  const [selectedProject, setSelectedProject] = useState<ProjectFilter>("all");
  const [focusMode, setFocusMode] = useState(false);
  const [previousFilter, setPreviousFilter] = useState<TaskFilter>("all");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedNewTaskProjectId, setSelectedNewTaskProjectId] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [projectColors, setProjectColors] = useState<Record<string, string>>({});

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
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

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

  const selectAllTasks = (tasksToSelect: TaskWithTags[]) => {
    setSelectedTaskIds(new Set(tasksToSelect.map((t) => t.id)));
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
    if (!window.confirm("Delete selected tasks? This cannot be undone.")) return;
    bulkDelete.mutate(Array.from(selectedTaskIds));
    setSelectedTaskIds(new Set());
    setIsSelectMode(false);
  };

  const handleBulkAssignProject = (tagId: string | null) => {
    selectedTaskIds.forEach((taskId) => {
      updateTaskTags.mutate({ taskId, tags: tagId ? [tagId] : [] });
    });
    clearSelection();
    setIsSelectMode(false);
  };

  const handleBulkSetDueDate = (choice: "today" | "tomorrow" | "nextWeek" | "clear") => {
    const start = getStartOfToday();
    const target =
      choice === "today"
        ? start
        : choice === "tomorrow"
          ? addDays(start, 1)
          : choice === "nextWeek"
            ? nextMonday(start)
            : null;
    selectedTaskIds.forEach((taskId) => {
      updateTaskDueDate.mutate({ taskId, dueAt: target ? target.toISOString() : null });
    });
    clearSelection();
    setIsSelectMode(false);
  };

  const projectFilteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedProject === "all") return true;
      if (selectedProject === "none") return task.tags.length === 0;
      const tagId = selectedProject.replace("tag:", "");
      return task.tags.some((tag) => tag.id === tagId);
    });
  }, [tasks, selectedProject]);

  const dueAtFor = (task: TaskWithTags) => (task.dueAt ? new Date(task.dueAt) : null);
  const completedAtFor = (task: TaskWithTags) =>
    task.completedAt ? new Date(task.completedAt) : null;

  const searchedTasks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    if (!query) return projectFilteredTasks;
    return projectFilteredTasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(query) ||
        (task.body ?? "").toLowerCase().includes(query) ||
        task.tags.some((tag) => tag.title.toLowerCase().includes(query))
      );
    });
  }, [projectFilteredTasks, deferredSearchQuery]);

  const tasksForFilter = useMemo(() => {
    switch (selectedFilter) {
      case "today":
        return searchedTasks.filter((task) => !task.completedAt && isTaskToday(dueAtFor(task)));
      case "upcoming":
        return searchedTasks.filter((task) => !task.completedAt && isTaskUpcoming(dueAtFor(task)));
      case "overdue":
        return searchedTasks.filter((task) => !task.completedAt && isTaskOverdue(dueAtFor(task)));
      case "completed":
        return searchedTasks.filter((task) => task.completedAt);
      default:
        return searchedTasks;
    }
  }, [searchedTasks, selectedFilter]);

  const filterChips = useMemo(
    () => [
      {
        id: "all",
        label: "All",
        count: projectFilteredTasks.length,
        tint: "bg-primary",
      },
      {
        id: "today",
        label: "Today",
        count: projectFilteredTasks.filter(
          (task) => !task.completedAt && isTaskToday(dueAtFor(task)),
        ).length,
        tint: "bg-orange-500",
      },
      {
        id: "upcoming",
        label: "Upcoming",
        count: projectFilteredTasks.filter(
          (task) => !task.completedAt && isTaskUpcoming(dueAtFor(task)),
        ).length,
        tint: "bg-blue-500",
      },
      {
        id: "overdue",
        label: "Overdue",
        count: projectFilteredTasks.filter(
          (task) => !task.completedAt && isTaskOverdue(dueAtFor(task)),
        ).length,
        tint: "bg-red-500",
      },
      {
        id: "completed",
        label: "Completed",
        count: projectFilteredTasks.filter((task) => task.completedAt).length,
        tint: "bg-primary/70",
      },
    ],
    [projectFilteredTasks],
  );

  const projectChips = useMemo(
    () => [
      {
        id: "all",
        label: "All",
        count: tasks.length,
        tint: "bg-muted-foreground/40",
      },
      {
        id: "none",
        label: "No Project",
        count: tasks.filter((task) => task.tags.length === 0).length,
        tint: "bg-muted-foreground/40",
      },
      ...tags.map((tag, index) => ({
        id: `tag:${tag.id}`,
        label: tag.title,
        count: tasks.filter((task) => task.tags.some((t) => t.id === tag.id)).length,
        tint: "bg-primary/60",
        color: getProjectColor(projectColors, tag.id, index),
      })),
    ],
    [tasks, tags, projectColors],
  );

  const focusTodayTasks = useMemo(
    () => searchedTasks.filter((task) => (task.dueAt ? isToday(new Date(task.dueAt)) : false)),
    [searchedTasks],
  );

  const focusSummary = useMemo(() => {
    const total = focusTodayTasks.length;
    const completed = focusTodayTasks.filter((task) => task.completedAt).length;
    return { total, completed, remaining: total - completed };
  }, [focusTodayTasks]);

  const sections = useMemo(() => {
    const pending = tasksForFilter.filter((task) => !task.completedAt);
    const completed = tasksForFilter.filter((task) => task.completedAt);
    if (focusMode) {
      const overdue = pending
        .filter((task) => isTaskOverdue(dueAtFor(task)))
        .sort((a, b) => (dueAtFor(a)?.getTime() ?? 0) - (dueAtFor(b)?.getTime() ?? 0));
      const today = pending.filter((task) => isTaskToday(dueAtFor(task)));
      const upcoming = pending
        .filter((task) => isTaskUpcoming(dueAtFor(task)))
        .sort((a, b) => (dueAtFor(a)?.getTime() ?? 0) - (dueAtFor(b)?.getTime() ?? 0));
      if (!overdue.length && !today.length && upcoming.length) {
        return [{ title: "Upcoming", tintClass: "bg-blue-500", tasks: upcoming }];
      }
      return [
        ...(overdue.length ? [{ title: "Overdue", tintClass: "bg-red-500", tasks: overdue }] : []),
        ...(today.length ? [{ title: "Today", tintClass: "bg-orange-500", tasks: today }] : []),
      ];
    }
    if (selectedFilter === "completed") {
      const sorted = completed
        .slice(0, 15)
        .sort((a, b) => (completedAtFor(b)?.getTime() ?? 0) - (completedAtFor(a)?.getTime() ?? 0));
      return [
        {
          title: "Completed",
          tintClass: "bg-primary",
          tasks: sorted,
          count: completed.length,
          overflowCount: Math.max(0, completed.length - sorted.length),
        },
      ];
    }
    if (selectedFilter !== "all") {
      const tint = filterChips.find((chip) => chip.id === selectedFilter)?.tint ?? "bg-primary";
      return [
        {
          title: selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1),
          tintClass: tint,
          tasks: tasksForFilter,
        },
      ];
    }

    const overdue = pending
      .filter((task) => isTaskOverdue(dueAtFor(task)))
      .sort((a, b) => (dueAtFor(a)?.getTime() ?? 0) - (dueAtFor(b)?.getTime() ?? 0));
    const today = pending.filter((task) => isTaskToday(dueAtFor(task)));
    const upcoming = pending
      .filter((task) => isTaskUpcoming(dueAtFor(task)))
      .sort((a, b) => (dueAtFor(a)?.getTime() ?? 0) - (dueAtFor(b)?.getTime() ?? 0));
    const noDate = pending
      .filter((task) => !task.dueAt)
      .sort(
        (a, b) =>
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0),
      );
    const completedSection = completed
      .sort((a, b) => (completedAtFor(b)?.getTime() ?? 0) - (completedAtFor(a)?.getTime() ?? 0))
      .slice(0, 15);

    const sections = [];
    if (overdue.length)
      sections.push({ title: "Overdue", tintClass: "bg-red-500", tasks: overdue });
    if (today.length) sections.push({ title: "Today", tintClass: "bg-orange-500", tasks: today });
    if (upcoming.length)
      sections.push({ title: "Upcoming", tintClass: "bg-blue-500", tasks: upcoming });
    if (noDate.length)
      sections.push({ title: "No Date", tintClass: "bg-muted-foreground", tasks: noDate });
    if (completedSection.length)
      sections.push({
        title: "Completed",
        tintClass: "bg-primary/70",
        tasks: completedSection,
        count: completed.length,
        overflowCount: Math.max(0, completed.length - completedSection.length),
      });
    return sections;
  }, [tasksForFilter, selectedFilter, focusMode, filterChips]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedProject !== "all" || selectedFilter !== "all";

  const emptyState = useMemo(() => {
    if (searchQuery.trim()) {
      return {
        title: "No matching tasks",
        message: "Try a different search term.",
        icon: <Search />,
      };
    }
    if (selectedFilter === "today") {
      return { title: "No tasks today", message: "You are clear for today.", icon: <Sun /> };
    }
    if (selectedFilter === "upcoming") {
      return {
        title: "Nothing upcoming",
        message: "Schedule tasks to see them here.",
        icon: <Calendar />,
      };
    }
    if (selectedFilter === "overdue") {
      return {
        title: "No overdue tasks",
        message: "Nice work staying on top of things.",
        icon: <CheckCircle2 />,
      };
    }
    if (selectedFilter === "completed") {
      return {
        title: "No completed tasks",
        message: "Complete a task to see it here.",
        icon: <CheckCircle2 />,
      };
    }
    if (selectedProject === "none") {
      return {
        title: "No unassigned tasks",
        message: "Every task already has a project.",
        icon: <Filter />,
      };
    }
    if (selectedProject.startsWith("tag:")) {
      const tagId = selectedProject.replace("tag:", "");
      const tag = tags.find((t) => t.id === tagId);
      return {
        title: tag ? `No tasks in ${tag.title}` : "No tasks in project",
        message: "Add a task or assign one to this project.",
        icon: <Filter />,
      };
    }
    return {
      title: "No tasks yet",
      message: "Type above to add your first task.",
      icon: <ListTodo />,
    };
  }, [searchQuery, selectedFilter, selectedProject, tags]);

  const parsedQuickAdd = useMemo(() => parseQuickAdd(newTaskTitle, tags), [newTaskTitle, tags]);
  const quickAddTokens = useMemo(() => {
    const tokens = quickAddSummary(parsedQuickAdd, tags) ?? [];
    if (!parsedQuickAdd.tagId && !parsedQuickAdd.projectName && selectedNewTaskProjectId) {
      const tag = tags.find((t) => t.id === selectedNewTaskProjectId);
      if (tag) tokens.push(tag.title);
    }
    return tokens.length ? tokens : null;
  }, [parsedQuickAdd, tags, selectedNewTaskProjectId]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedProject("all");
    setFocusMode(false);
  };

  const handleCreateTaskFromInput = (title: string) => {
    const parsed = parseQuickAdd(title, tags);
    const fallbackProjectId = selectedProject.startsWith("tag:")
      ? selectedProject.replace("tag:", "")
      : null;
    const projectId = selectedNewTaskProjectId ?? parsed.tagId ?? fallbackProjectId;
    const projectTag = projectId ? tags.find((tag) => tag.id === projectId) : null;
    const dueAt = parsed.dueAt ? parsed.dueAt.toISOString() : undefined;

    createTask.mutate(
      {
        title: parsed.title,
        dueAt,
        tags: projectTag ? [{ id: projectTag.id, title: projectTag.title }] : [],
      },
      {
        onSuccess: (data) => {
          if (projectId) {
            updateTaskTags.mutate({ taskId: data.task.id, tags: [projectId] });
            return;
          }
          if (parsed.projectName) {
            createTag.mutate(
              { title: parsed.projectName },
              {
                onSuccess: (tag) => {
                  updateTaskTags.mutate({ taskId: data.task.id, tags: [tag.tag.id] });
                  setSelectedNewTaskProjectId(tag.tag.id);
                },
              },
            );
          }
        },
      },
    );

    setNewTaskTitle("");
  };

  const getAllTags = useCallback(
    async () => tags.map((t) => ({ id: t.id, title: t.title })),
    [tags],
  );

  useEffect(() => {
    setProjectColors(loadProjectColors());
  }, []);

  useEffect(() => {
    const handler = () => setProjectColors(loadProjectColors());
    window.addEventListener("projectColorsChanged", handler);
    return () => window.removeEventListener("projectColorsChanged", handler);
  }, []);

  useEffect(() => {
    if (!selectedTask) return;
    const updated = tasks.find((task) => task.id === selectedTask.id);
    if (updated) {
      setSelectedTask(updated);
    }
  }, [tasks, selectedTask]);

  const handleOpenDetail = (task: TaskWithTags) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleToggleFocus = () => {
    if (focusMode) {
      setFocusMode(false);
      setSelectedFilter(previousFilter);
    } else {
      setPreviousFilter(selectedFilter);
      setSelectedFilter("today");
      setFocusMode(true);
    }
  };

  const handleSetViewMode = (mode: "tasks" | "projects") => {
    setViewMode(mode);
    if (mode === "projects") {
      setIsSelectMode(false);
      setSelectedTaskIds(new Set());
      setFocusMode(false);
      setSearchQuery("");
    } else {
      setProjectSearchQuery("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TaskListHeader
        viewMode={viewMode}
        setViewMode={handleSetViewMode}
        searchQuery={viewMode === "projects" ? projectSearchQuery : searchQuery}
        setSearchQuery={(value) =>
          viewMode === "projects" ? setProjectSearchQuery(value) : setSearchQuery(value)
        }
        isSearching={viewMode === "tasks" ? isSearching : false}
        focusMode={focusMode}
        onToggleFocus={handleToggleFocus}
        onCreateProject={() => setShowCreateProject(true)}
      />
      {viewMode === "projects" ? (
        <ProjectsList
          tags={tags}
          tasks={tasks}
          searchQuery={projectSearchQuery}
          showCreate={showCreateProject}
          onCreateProject={(title) => {
            createTag.mutate({ title });
            setShowCreateProject(false);
          }}
          onCancelCreate={() => setShowCreateProject(false)}
          onUpdateProject={(tagId, title) => {
            if (!title.trim()) return;
            updateTag.mutate({ tagId, title: title.trim() });
          }}
          onDeleteProject={(tagId) => deleteTag.mutate(tagId)}
        />
      ) : (
        <TaskListContainer
          sections={sections}
          searchQuery={searchQuery}
          hasActiveFilters={hasActiveFilters}
          emptyState={emptyState}
          onClearFilters={handleClearFilters}
          onCreateTask={handleCreateTaskFromInput}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          quickAddTokens={quickAddTokens}
          tags={tags}
          selectedNewTaskProjectId={selectedNewTaskProjectId}
          setSelectedNewTaskProjectId={setSelectedNewTaskProjectId}
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
          onOpenDetail={handleOpenDetail}
          selectAllTasks={() => selectAllTasks(tasksForFilter)}
          clearSelection={clearSelection}
          handleBulkComplete={handleBulkComplete}
          handleBulkDelete={handleBulkDelete}
          handleBulkAssignProject={handleBulkAssignProject}
          handleBulkSetDueDate={handleBulkSetDueDate}
          filterChips={filterChips}
          selectedFilter={selectedFilter}
          onSelectFilter={(value) => {
            if (focusMode && value !== "today") setFocusMode(false);
            setSelectedFilter(value as TaskFilter);
          }}
          projectChips={projectChips}
          selectedProject={selectedProject}
          onSelectProject={(value) => setSelectedProject(value as ProjectFilter)}
          onAddProject={() => {
            setShowCreateProject(true);
            handleSetViewMode("projects");
          }}
          focusMode={focusMode}
          focusSummary={focusSummary}
          projectColors={projectColors}
        />
      )}
      <TaskDetailDialog
        task={selectedTask}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedTask(null);
        }}
        tags={tags}
        onToggleComplete={(task) => handleToggleTask(task)}
        onDelete={(taskId) => {
          if (!window.confirm("Delete this task? This cannot be undone.")) return;
          handleDeleteTask(taskId);
          setIsDetailOpen(false);
        }}
        updateTask={async (taskId, data) => {
          await handleUpdateTask(taskId, data);
        }}
        updateTaskTags={async (taskId, tags) => {
          await handleUpdateTaskTags(taskId, tags);
        }}
        createTag={handleCreateTagForTask}
      />
    </div>
  );
};

export default TaskList;
