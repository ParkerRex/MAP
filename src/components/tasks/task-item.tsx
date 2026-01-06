"use client";

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
import { Textarea } from "@/components/ui/textarea";
import type { TaskWithTags } from "@/types";
import { getTaskDueLabel } from "./task-utils";

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
  onOpenDetail?: (task: TaskWithTags) => void;
  projectColors?: Record<string, string>;
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
  onOpenDetail,
  projectColors = {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [body, setBody] = useState(task.body ?? "");
  const [tags, setTags] = useState<string[]>(task.tags?.map((t) => t.id) ?? []);
  const [availableTags, setAvailableTags] = useState<{ id: string; title: string }[]>([]);
  const [newTag, setNewTag] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCompleted = !!task.completedAt;

  useEffect(() => {
    setTitle(task.title);
    setBody(task.body ?? "");
    setTags(task.tags?.map((t) => t.id) ?? []);
  }, [task.title, task.body, task.tags]);

  useEffect(() => {
    getAllTags().then((t) => setAvailableTags(t));
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
      await updateTaskDueDate(task.id, date.toISOString());
      setIsDatePickerOpen(false);
    }
  };

  const handleTagToggle = async (tagId: string) => {
    if (tagId === "clear") {
      setTags([]);
      if (task.id) {
        await updateTaskTags(task.id, []);
      }
      return;
    }
    const updatedTags = tags.includes(tagId)
      ? tags.filter((t) => t !== tagId)
      : [...tags, tagId];
    setTags(updatedTags);
    if (task.id) {
      await updateTaskTags(task.id, updatedTags);
    }
  };

  const handleCreateTag = async () => {
    const trimmed = newTag.trim();
    if (trimmed) {
      const existing = availableTags.find(
        (tag) => tag.title.toLowerCase() === trimmed.toLowerCase(),
      );
      let tagId = existing?.id;
      if (!tagId) {
        const created = await createTag(trimmed);
        tagId = created.id;
        setAvailableTags([...availableTags, created]);
      }
      const updatedTags = tagId && !tags.includes(tagId) ? [...tags, tagId] : tags;
      setTags(updatedTags);
      if (task.id) {
        await updateTaskTags(task.id, updatedTags);
      }
    }
    setNewTag("");
  };

  const dueDateInfo = getTaskDueLabel(task);
  const currentTags = tags
    .map((id) => availableTags.find((tag) => tag.id === id))
    .filter((tag): tag is { id: string; title: string } => Boolean(tag));
  const primaryTag = currentTags[0];
  const primaryColor = primaryTag ? projectColors[primaryTag.id] : undefined;

  return (
    <>
      <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card transition-all",
        "hover:shadow-sm hover:border-border/80",
        isSelected && "ring-2 ring-primary bg-primary/5",
        isCompleted && "opacity-60",
      )}
      onClick={() => {
        if (isSelectMode) {
          onToggleSelect();
        } else if (!isEditing && !isQuickEditing) {
          onOpenDetail?.(task);
        }
      }}
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

        {!isQuickEditing && (primaryTag || dueDateInfo || task.body) && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {primaryTag && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={primaryColor ? { background: primaryColor } : undefined}
                />
                <span>{primaryTag.title}</span>
              </span>
            )}
            {dueDateInfo && (
              <span
                className={cn(
                  "font-medium",
                  dueDateInfo.tone === "overdue" && "text-red-500",
                  dueDateInfo.tone === "today" && "text-orange-500",
                  dueDateInfo.tone === "soon" && "text-blue-500",
                  dueDateInfo.tone === "muted" && "text-muted-foreground",
                )}
              >
                {dueDateInfo.text}
              </span>
            )}
            {task.body && <span className="truncate">{task.body}</span>}
          </div>
        )}
      </div>

      {/* Tags */}
      {currentTags.length > 1 && (
        <div className="hidden sm:flex gap-1">
          {currentTags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
              {tag.title}
            </Badge>
          ))}
          {currentTags.length > 2 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              +{currentTags.length - 2}
            </Badge>
          )}
        </div>
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
              <DropdownMenuCheckboxItem
                checked={tags.length === 0}
                onCheckedChange={() => handleTagToggle("clear")}
                className="text-muted-foreground"
              >
                No project
              </DropdownMenuCheckboxItem>
              {availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={tags.includes(tag.id)}
                  onCheckedChange={() => handleTagToggle(tag.id)}
                >
                  {tag.title}
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
              <DropdownMenuItem onClick={() => onOpenDetail?.(task)}>Open details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleTaskCompletion(task)}>
                {isCompleted ? "Mark incomplete" : "Mark complete"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsQuickEditing(true)}>
                Quick edit
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
      {isQuickEditing && (
        <div className="mt-2 rounded-lg border bg-muted/40 p-3">
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notes"
              rows={3}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsQuickEditing(false);
                setTitle(task.title);
                setBody(task.body ?? "");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                if (task.id) {
                  await updateTask(task.id, { title: title.trim(), body: body.trim() });
                }
                setIsQuickEditing(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskItem;
