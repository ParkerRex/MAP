"use client";

import { differenceInDays, format, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, Check, Loader2, MoreHorizontal, Tag, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TaskWithTags } from "@/types";

interface TaskItemProps {
  task: TaskWithTags;
  toggleTaskCompletion: (task: TaskWithTags) => void;
  handleDelete: (taskId: string) => void;
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
  toggleTaskCompletion,
  handleDelete,
  updateTaskDueDate,
  updateTask,
  getAllTags,
  createTag,
  updateTaskTags,
  isSelectMode,
  isSelected,
  onToggleSelect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [tags, setTags] = useState<string[]>(task.tags?.map((t) => t.title) ?? []);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCompleted = !!task.completedAt;

  useEffect(() => {
    setTitle(task.title);
    setTags(task.tags?.map((t) => t.title) ?? []);
  }, [task.title, task.tags]);

  useEffect(() => {
    getAllTags().then((t) => setAvailableTags(t.map((tag) => tag.title)));
  }, [getAllTags]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const debouncedSave = useCallback(
    (newTitle: string) => {
      if (!task.id) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setSaveStatus("saving");
      debounceTimerRef.current = setTimeout(async () => {
        try {
          await updateTask(task.id, { title: newTitle });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1000);
        } catch {
          setSaveStatus("idle");
        }
      }, 400);
    },
    [task.id, updateTask],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedSave(newTitle);
  };

  const handleDateChange = async (date: Date) => {
    if (task.id) {
      const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      await updateTaskDueDate(task.id, formattedDate);
      setIsDatePickerOpen(false);
    }
  };

  const handleTagToggle = async (tagTitle: string) => {
    const updatedTags = tags.includes(tagTitle)
      ? tags.filter((t) => t !== tagTitle)
      : [...tags, tagTitle];
    setTags(updatedTags);
    if (task.id) {
      await updateTaskTags(task.id, updatedTags);
    }
  };

  const handleCreateTag = async () => {
    if (newTag && !tags.includes(newTag)) {
      if (!availableTags.includes(newTag)) {
        const created = await createTag(newTag);
        setAvailableTags([...availableTags, created.title]);
      }
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      if (task.id) {
        await updateTaskTags(task.id, updatedTags);
      }
      setNewTag("");
    }
  };

  const getDueDateInfo = (dueDate: Date | null | undefined) => {
    if (!dueDate || isNaN(dueDate.getTime())) return null;

    if (isToday(dueDate)) {
      return { text: "Today", className: "text-orange-600 dark:text-orange-400" };
    }
    if (isTomorrow(dueDate)) {
      return { text: "Tomorrow", className: "text-yellow-600 dark:text-yellow-400" };
    }
    if (isPast(dueDate)) {
      const days = Math.abs(differenceInDays(dueDate, new Date()));
      return { text: `${days}d overdue`, className: "text-red-600 dark:text-red-400" };
    }
    const days = differenceInDays(dueDate, new Date());
    if (days <= 7) {
      return { text: `${days}d`, className: "text-muted-foreground" };
    }
    return { text: format(dueDate, "MMM d"), className: "text-muted-foreground" };
  };

  const dueDateInfo = getDueDateInfo(task.dueAt);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card transition-all",
        "hover:shadow-sm hover:border-border/80",
        isSelected && "ring-2 ring-primary bg-primary/5",
        isCompleted && "opacity-60",
      )}
      onClick={() => isSelectMode && onToggleSelect()}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelectMode ? isSelected : isCompleted}
        onCheckedChange={() => (isSelectMode ? onToggleSelect() : toggleTaskCompletion(task))}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "h-5 w-5 rounded-full border-2",
          isCompleted && !isSelectMode && "bg-primary border-primary",
        )}
      />

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setIsEditing(false);
                }
              }}
              className="h-7 text-sm border-none bg-transparent p-0 focus-visible:ring-0"
            />
            {saveStatus !== "idle" && (
              <span className="text-xs text-muted-foreground">
                {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
                {saveStatus === "saved" && <Check className="w-3 h-3 text-green-500" />}
              </span>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              if (!isSelectMode) {
                e.stopPropagation();
                setIsEditing(true);
              }
            }}
            className={cn(
              "text-sm font-medium text-left truncate block w-full",
              isCompleted && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </button>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="hidden sm:flex gap-1">
          {task.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
              {tag.title}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              +{task.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Due date */}
      {dueDateInfo && (
        <span className={cn("text-xs font-medium whitespace-nowrap", dueDateInfo.className)}>
          {dueDateInfo.text}
        </span>
      )}

      {/* Actions - visible on hover */}
      {!isSelectMode && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Date picker */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <DatePicker
                mode="single"
                selected={task.dueAt ?? undefined}
                onSelect={(date) => date && handleDateChange(date)}
              />
            </PopoverContent>
          </Popover>

          {/* Tag dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <Tag className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={tags.includes(tag)}
                  onCheckedChange={() => handleTagToggle(tag)}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
              {availableTags.length > 0 && <DropdownMenuSeparator />}
              <div className="p-2">
                <Input
                  placeholder="New tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleTaskCompletion(task)}>
                {isCompleted ? "Mark incomplete" : "Mark complete"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => task.id && handleDelete(task.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
