"use client";

import { Calendar as CalendarIcon, CheckCircle2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/components/ui/cn";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tag, TaskWithTags } from "@/types";

interface TaskDetailDialogProps {
  task: TaskWithTags | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  onToggleComplete: (task: TaskWithTags) => void;
  onDelete: (taskId: string) => void;
  updateTask: (
    taskId: string,
    data: { title?: string; body?: string; dueAt?: string | null },
  ) => Promise<void>;
  updateTaskTags: (taskId: string, tags: string[]) => Promise<void>;
  createTag: (title: string) => Promise<{ id: string; title: string }>;
}

const TaskDetailDialog = ({
  task,
  open,
  onOpenChange,
  tags,
  onToggleComplete,
  onDelete,
  updateTask,
  updateTaskTags,
  createTag,
}: TaskDetailDialogProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setBody(task.body ?? "");
    setDueAt(task.dueAt ? new Date(task.dueAt) : null);
    const ids = task.tags?.map((tag) => tag.id) ?? [];
    setProjectId(ids[0] ?? null);
    setExtraTags(ids.slice(1));
    setNewTag("");
  }, [task]);

  const selectedTagIds = useMemo(() => {
    const ids = projectId ? [projectId, ...extraTags] : extraTags;
    return Array.from(new Set(ids));
  }, [projectId, extraTags]);

  if (!task) return null;

  const handleSave = async () => {
    await updateTask(task.id, {
      title: title.trim(),
      body: body.trim(),
      dueAt: dueAt ? dueAt.toISOString() : null,
    });
    await updateTaskTags(task.id, selectedTagIds);
    onOpenChange(false);
  };

  const handleCreateTag = async () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    const created = await createTag(trimmed);
    setExtraTags((prev) => [...prev, created.id]);
    setNewTag("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name" />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notes"
            rows={4}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Project</div>
              <Select
                value={projectId ?? "none"}
                onValueChange={(value) => setProjectId(value === "none" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Due Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dueAt ? dueAt.toLocaleDateString() : "No due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueAt ?? undefined}
                    onSelect={(date) => date && setDueAt(date)}
                  />
                  <div className="p-3 pt-0">
                    <Button variant="ghost" size="sm" onClick={() => setDueAt(null)}>
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Tags</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between w-full">
                  {selectedTagIds.length ? `${selectedTagIds.length} selected` : "Add tags"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                {tags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    checked={selectedTagIds.includes(tag.id)}
                    onCheckedChange={() => {
                      if (selectedTagIds.includes(tag.id)) {
                        if (projectId === tag.id) {
                          setProjectId(null);
                        } else {
                          setExtraTags((prev) => prev.filter((id) => id !== tag.id));
                        }
                      } else {
                        setExtraTags((prev) => [...prev, tag.id]);
                      }
                    }}
                  >
                    {tag.title}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2">
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
                  />
                  <Button size="sm" onClick={handleCreateTag} disabled={!newTag.trim()}>
                    Add tag
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex flex-wrap gap-2">
              {selectedTagIds.map((id) => {
                const tag = tags.find((t) => t.id === id);
                if (!tag) return null;
                return (
                  <span
                    key={id}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {tag.title}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className={cn("mt-4 flex flex-wrap justify-between gap-2")}>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onToggleComplete(task)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {task.completedAt ? "Mark incomplete" : "Mark complete"}
            </Button>
            <Button variant="destructive" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
