"use client";
import { differenceInDays, format } from "date-fns";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { Calendar, Check, Flag, Loader2, Tag } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TaskWithTags } from "@/types";

interface TaskItemProps {
  task: TaskWithTags;
  highlightedTaskId: string | null;
  selectedTask: TaskWithTags | null;
  searchQuery: string;
  handleTaskClick: (task: TaskWithTags) => void;
  handleTaskDoubleClick: (task: TaskWithTags) => void;
  toggleTaskCompletion: (task: TaskWithTags) => void;
  handleDelete: (taskId: string) => void;
  setSelectedTask: (task: TaskWithTags | null) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => Promise<void>;
  updateTask: (taskId: string, data: { title?: string; body?: string }) => Promise<void>;
  getAllTags: () => Promise<{ id: string; title: string }[]>;
  createTag: (title: string) => Promise<{ id: string; title: string }>;
  updateTaskTags: (taskId: string, tags: string[]) => Promise<void>;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const TaskItem: FC<TaskItemProps> = ({
  task,
  highlightedTaskId,
  selectedTask,
  searchQuery: _searchQuery,
  handleTaskClick,
  handleTaskDoubleClick,
  toggleTaskCompletion,
  handleDelete,
  setSelectedTask,
  updateTaskDueDate,
  updateTask,
  getAllTags,
  createTag,
  updateTaskTags,
  isSelectMode,
  isSelected,
  onToggleSelect,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localDueDate, setLocalDueDate] = useState(task.dueAt);
  const [title, setTitle] = useState(task.title);
  const [body, setBody] = useState(task.body || "");
  const [tags, setTags] = useState<string[]>(task.tags?.map((tag) => tag.title) ?? []);
  const [newTag, setNewTag] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when task prop changes
  useEffect(() => {
    setTitle(task.title);
    setBody(task.body || "");
  }, [task.title, task.body]);

  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getAllTags();
      setAvailableTags(tags.map((tag) => tag.title));
    };
    fetchTags();
  }, [getAllTags]);

  // Debounced save function
  const debouncedSave = useCallback(
    (data: { title?: string; body?: string }) => {
      if (!task.id) return;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setSaveStatus("saving");

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await updateTask(task.id, data);
          setSaveStatus("saved");
          // Reset to idle after showing "saved" briefly
          setTimeout(() => setSaveStatus("idle"), 1500);
        } catch {
          setSaveStatus("idle");
        }
      }, 500);
    },
    [task.id, updateTask],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  const handleBodyChange = (newBody: string) => {
    setBody(newBody);
    debouncedSave({ body: newBody });
  };

  const handleDateChange = async (date: Date) => {
    if (task.id) {
      const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      await updateTaskDueDate(task.id, formattedDate);
      setLocalDueDate(date);
      setIsPopoverOpen(false);
    }
  };

  const addTag = async () => {
    if (newTag && !tags.includes(newTag)) {
      if (!availableTags.includes(newTag)) {
        const createdTag = await createTag(newTag);
        setAvailableTags([...availableTags, createdTag.title]);
      }
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      if (task.id) {
        await updateTaskTags(task.id, updatedTags);
      }
      setNewTag("");
    }
  };

  const _removeTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    if (task.id) {
      await updateTaskTags(task.id, updatedTags);
    }
  };

  const handleTagSelect = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const getCountdownText = (dueDate: Date | null | undefined) => {
    if (!dueDate) return null;
    if (isNaN(dueDate.getTime())) return null;

    const now = new Date();
    const diff = differenceInDays(dueDate, now);

    if (diff === 0) {
      return <span className="text-red-500">today</span>;
    }
    if (diff === 1) {
      return <span className="text-red-500">1 day left</span>;
    }
    return <span className="text-gray-500">{diff} days left</span>;
  };

  const getCountdownClass = (dueDate: Date | null | undefined) => {
    if (!dueDate) return "";
    if (isNaN(dueDate.getTime())) return "";

    const now = new Date();
    const diff = differenceInDays(dueDate, now);

    if (diff <= 1) {
      return "text-red-500";
    }
    return "text-gray-500";
  };
  return (
    <Reorder.Item key={task.id} value={task}>
      <ContextMenu>
        <ContextMenuTrigger>
          <motion.div
            className={`relative flex flex-col gap-2 p-1 rounded-sm select-none transition-colors border bg-card text-card-foreground border-slate-100 dark:border-none dark:bg-[#2E2E2E] dark:shadow-md dark:shadow-gray-950 ${
              highlightedTaskId === task.id ? "bg-gray-100" : ""
            } ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
            onClick={() => (isSelectMode ? onToggleSelect() : handleTaskClick(task))}
            onDoubleClick={() => !isSelectMode && handleTaskDoubleClick(task)}
            layout
            initial={{ borderRadius: "0.375rem" }}
            animate={{ borderRadius: "0.375rem" }}
          >
            <div className="flex items-center gap-2">
              {isSelectMode ? (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelect}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <Checkbox
                  checked={!!task.completedAt}
                  onCheckedChange={() => toggleTaskCompletion(task)}
                />
              )}
              <Input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-sm bg-none text-black dark:text-white border-none rounded-md placeholder-gray-400 dark:placeholder-white"
              />
              {saveStatus !== "idle" && (
                <span className="flex items-center text-xs text-muted-foreground">
                  {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
                  {saveStatus === "saved" && <Check className="w-3 h-3 text-green-500" />}
                </span>
              )}
              <AnimatePresence>
                {selectedTask?.id !== task.id && task.tags && task.tags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex"
                  >
                    {task.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="flex items-center text-gray-500 bg-opacity-50 dark:text-white"
                      >
                        {tag.title}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Calendar className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary" />
                </PopoverTrigger>
                <PopoverContent>
                  <DatePicker selected={localDueDate ?? new Date()} onDayClick={handleDateChange} />
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Tag className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Available Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={tags.includes(tag)}
                      onCheckedChange={() => handleTagSelect(tag)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-4 py-2">
                    <Input
                      placeholder="New tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addTag();
                        }
                      }}
                      className="bg-gray-800 text-white border border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-white"
                    />
                    <Button onClick={addTag} className="mt-2">
                      Add Tag
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <AnimatePresence>
              {selectedTask?.id === task.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col flex-1 gap-2 p-2">
                    <Input
                      type="text"
                      value={body}
                      placeholder="Add a note..."
                      onChange={(e) => handleBodyChange(e.target.value)}
                      className="text-sm text-gray-400 border-none rounded-md placeholder-gray-400 dark:placeholder-white"
                    />
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex">
                        {task.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="flex items-center text-green-900 bg-green-600 bg-opacity-50 dark:text-white dark:bg-green-900"
                          >
                            {tag.title}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {localDueDate && (
                      <div
                        className={`flex gap-2 items-center text-gray-300 ${getCountdownClass(
                          localDueDate,
                        )}`}
                      >
                        <Flag className="size-4" />
                        <div className="text-xs font-medium">
                          Deadline: {getCountdownText(localDueDate)}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => setSelectedTask(task)}>View Task</ContextMenuItem>
          <ContextMenuItem onSelect={() => task.id && handleDelete(task.id)}>
            Delete Task
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => toggleTaskCompletion(task)}>
            {task.completedAt ? "Mark Incomplete" : "Mark Complete"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Reorder.Item>
  );
};

export default TaskItem;
