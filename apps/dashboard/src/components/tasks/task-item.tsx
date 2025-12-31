"use client";
import type { Tag as TagType, Task } from "@/types";
import { Badge } from "@map/ui/badge";
import { Button } from "@map/ui/button";
import { Calendar as DatePicker } from "@map/ui/calendar";
import { Checkbox } from "@map/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@map/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@map/ui/dropdown-menu";
import { Input } from "@map/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@map/ui/popover";
import { differenceInDays, format, parseISO } from "date-fns";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { Calendar, Flag, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import type React from "react";
import type { FC } from "react";

interface TaskItemProps {
  task: Task;
  highlightedTaskId: string | null;
  selectedTask: Task | null;
  searchQuery: string;
  handleTaskClick: (task: Task) => void;
  handleTaskDoubleClick: (task: Task) => void;
  toggleTaskCompletion: (task: Task) => void;
  handleDelete: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => Promise<void>;
  getAllTags: () => Promise<TagType[]>;
  createTag: (title: string) => Promise<TagType>;
  updateTaskTags: (taskId: string, tags: string[]) => Promise<void>;
}

const TaskItem: FC<TaskItemProps> = ({
  task,
  highlightedTaskId,
  selectedTask,
  searchQuery,
  handleTaskClick,
  handleTaskDoubleClick,
  toggleTaskCompletion,
  handleDelete,
  setSelectedTask,
  updateTaskDueDate,
  getAllTags,
  createTag,
  updateTaskTags,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localDueDate, setLocalDueDate] = useState(task.due_at);
  const [title, setTitle] = useState(task.title);
  const [body, setBody] = useState(task.body || "");
  const [tags, setTags] = useState<string[]>(task.tags?.map((tag) => tag.title) ?? []);
  const [newTag, setNewTag] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getAllTags();
      setAvailableTags(tags.map((tag) => tag.title));
    };
    fetchTags();
  }, [getAllTags]);

  const handleDateChange = async (date: Date) => {
    if (task.id) {
      const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      await updateTaskDueDate(task.id, formattedDate);
      setLocalDueDate(formattedDate);
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

  const removeTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    if (task.id) {
      await updateTaskTags(task.id, updatedTags);
    }
  };

  const handleTagSelect = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const getCountdownText = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const diff = differenceInDays(date, now);

    if (diff === 0) {
      return <span className="text-red-500">today</span>;
    }
    if (diff === 1) {
      return <span className="text-red-500">1 day left</span>;
    }
    return <span className="text-gray-500">{diff} days left</span>;
  };

  const getCountdownClass = (dueDate: string | undefined) => {
    if (!dueDate) return "";
    const date = parseISO(dueDate);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diff = differenceInDays(date, now);

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
            }`}
            onClick={() => handleTaskClick(task)}
            onDoubleClick={() => handleTaskDoubleClick(task)}
            layout
            initial={{ borderRadius: "0.375rem" }}
            animate={{ borderRadius: "0.375rem" }}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={!!task.completed_at}
                onCheckedChange={() => toggleTaskCompletion(task)}
              />
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm bg-none text-black dark:text-white border-none rounded-md placeholder-gray-400 dark:placeholder-white"
              />
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
                  <DatePicker
                    selected={localDueDate ? parseISO(localDueDate) : new Date()}
                    onDayClick={handleDateChange}
                  />
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
                      placeholder="Note"
                      onChange={(e) => setBody(e.target.value)}
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
            {task.completed_at ? "Mark Incomplete" : "Mark Complete"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Reorder.Item>
  );
};

export default TaskItem;
