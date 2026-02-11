"use client";

import { ChevronDown, ChevronUp, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tag, TaskWithTags } from "@/types";
import {
  defaultProjectColors,
  getProjectColor,
  loadProjectColors,
  saveProjectColors,
  setProjectColor,
} from "./project-colors";

interface ProjectsListProps {
  tags: Tag[];
  tasks: TaskWithTags[];
  searchQuery: string;
  showCreate: boolean;
  onCreateProject: (title: string) => void;
  onCancelCreate: () => void;
  onUpdateProject: (tagId: string, title: string) => void;
  onDeleteProject: (tagId: string) => void;
}

const ProjectsList = ({
  tags,
  tasks,
  searchQuery,
  showCreate,
  onCreateProject,
  onCancelCreate,
  onUpdateProject,
  onDeleteProject,
}: ProjectsListProps) => {
  const [newTitle, setNewTitle] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [projectColors, setProjectColors] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("tasks.projectFavorites");
    const storedOrder = localStorage.getItem("tasks.projectOrder");
    if (storedFavorites) {
      try {
        setFavoriteIds(JSON.parse(storedFavorites));
      } catch {
        setFavoriteIds([]);
      }
    }
    if (storedOrder) {
      try {
        setOrderIds(JSON.parse(storedOrder));
      } catch {
        setOrderIds([]);
      }
    }
    setProjectColors(loadProjectColors());
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks.projectFavorites", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem("tasks.projectOrder", JSON.stringify(orderIds));
  }, [orderIds]);

  useEffect(() => {
    saveProjectColors(projectColors);
  }, [projectColors]);

  const filteredTags = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter((tag) => tag.title.toLowerCase().includes(query));
  }, [tags, searchQuery]);

  useEffect(() => {
    const ids = new Set(tags.map((tag) => tag.id));
    const normalizedFavorites = favoriteIds.filter((id) => ids.has(id));
    const normalizedOrder = orderIds.filter(
      (id) => ids.has(id) && !normalizedFavorites.includes(id),
    );
    const missing = tags
      .map((tag) => tag.id)
      .filter((id) => !normalizedFavorites.includes(id) && !normalizedOrder.includes(id));
    if (
      normalizedFavorites.length !== favoriteIds.length ||
      normalizedOrder.length !== orderIds.length ||
      missing.length > 0
    ) {
      setFavoriteIds(normalizedFavorites);
      setOrderIds([...normalizedOrder, ...missing]);
    }
  }, [tags, favoriteIds, orderIds]);

  const taskCountForTag = (tagId: string) =>
    tasks.filter((task) => task.tags?.some((tag) => tag.id === tagId)).length;

  const handleCreate = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onCreateProject(trimmed);
    setNewTitle("");
  };

  const emptyState = () => {
    if (searchQuery.trim()) {
      return (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No projects match your search.
        </div>
      );
    }
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Create your first project to group tasks.
      </div>
    );
  };

  const toggleFavorite = (tagId: string) => {
    if (favoriteIds.includes(tagId)) {
      setFavoriteIds((prev) => prev.filter((id) => id !== tagId));
      setOrderIds((prev) => (prev.includes(tagId) ? prev : [tagId, ...prev]));
    } else {
      setFavoriteIds((prev) => [...prev, tagId]);
      setOrderIds((prev) => prev.filter((id) => id !== tagId));
    }
  };

  const moveItem = (list: string[], from: number, to: number) => {
    if (to < 0 || to >= list.length) return list;
    const copy = [...list];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  };

  const tagById = useMemo(() => new Map(filteredTags.map((tag) => [tag.id, tag])), [filteredTags]);

  const favoriteTags = favoriteIds.map((id) => tagById.get(id)).filter(Boolean) as Tag[];
  const regularTags = [
    ...orderIds.map((id) => tagById.get(id)).filter(Boolean),
    ...filteredTags.filter((tag) => !favoriteIds.includes(tag.id) && !orderIds.includes(tag.id)),
  ] as Tag[];

  const renderRow = (tag: Tag, listType: "favorite" | "regular", indexHint: number) => {
    const list = listType === "favorite" ? favoriteTags : regularTags;
    const index = list.findIndex((item) => item.id === tag.id);
    const color = getProjectColor(projectColors, tag.id, indexHint);

    return (
      <div
        key={tag.id}
        className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
        draggable
        onDragStart={() => setDraggingId(tag.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => {
          if (!draggingId || draggingId === tag.id) return;
          if (listType === "favorite") {
            const ids = favoriteTags.map((t) => t.id);
            const from = ids.indexOf(draggingId);
            const to = ids.indexOf(tag.id);
            setFavoriteIds(moveItem(ids, from, to));
          } else {
            const ids = regularTags.map((t) => t.id);
            const from = ids.indexOf(draggingId);
            const to = ids.indexOf(tag.id);
            setOrderIds(moveItem(ids, from, to));
          }
          setDraggingId(null);
        }}
        onDragEnd={() => setDraggingId(null)}
        onClick={() => setSelectedProjectId(tag.id)}
      >
        {editingTagId === tag.id ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="max-w-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdateProject(tag.id, editingTitle.trim());
                  setEditingTagId(null);
                }
                if (e.key === "Escape") setEditingTagId(null);
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                onUpdateProject(tag.id, editingTitle.trim());
                setEditingTagId(null);
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingTagId(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <div className="text-sm font-medium">{tag.title}</div>
            </div>
            <div className="text-xs text-muted-foreground">{taskCountForTag(tag.id)} tasks</div>
          </div>
        )}
        {editingTagId !== tag.id && (
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggleFavorite(tag.id)}
              title={favoriteIds.includes(tag.id) ? "Unpin" : "Pin"}
            >
              {favoriteIds.includes(tag.id) ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>
            <div className="flex flex-col">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (listType === "favorite") {
                    setFavoriteIds((prev) => moveItem(prev, index, index - 1));
                  } else {
                    setOrderIds((prev) => moveItem(prev, index, index - 1));
                  }
                }}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (listType === "favorite") {
                    setFavoriteIds((prev) => moveItem(prev, index, index + 1));
                  } else {
                    setOrderIds((prev) => moveItem(prev, index, index + 1));
                  }
                }}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditingTagId(tag.id);
                setEditingTitle(tag.title);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tasks in this project will not be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteProject(tag.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    );
  };

  const selectedProject = selectedProjectId ? tagById.get(selectedProjectId) : null;
  const selectedColor = selectedProject && getProjectColor(projectColors, selectedProject.id, 0);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {showCreate && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Project name"
            className="max-w-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") onCancelCreate();
            }}
          />
          <Button size="sm" onClick={handleCreate}>
            Create
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelCreate}>
            Cancel
          </Button>
        </div>
      )}

      {filteredTags.length === 0 ? (
        emptyState()
      ) : (
        <div className="space-y-4">
          {favoriteTags.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Favorites</div>
              {favoriteTags.map((tag, index) => renderRow(tag, "favorite", index))}
            </div>
          )}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Projects</div>
            {regularTags.map((tag, index) => renderRow(tag, "regular", index))}
          </div>
          {selectedProject && (
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Project Details</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedProject.title} · {taskCountForTag(selectedProject.id)} tasks
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedProjectId(null)}>
                  Close
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Color</div>
                <div className="flex flex-wrap gap-2">
                  {defaultProjectColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-7 w-7 rounded-full border ${selectedColor === color ? "ring-2 ring-primary" : ""}`}
                      style={{ background: color }}
                      onClick={() =>
                        setProjectColors((prev) => setProjectColor(prev, selectedProject.id, color))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
