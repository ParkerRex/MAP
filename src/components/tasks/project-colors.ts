"use client";

const STORAGE_KEY = "tasks.projectColors";

export const defaultProjectColors = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#eab308",
  "#64748b",
];

export const loadProjectColors = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
};

export const saveProjectColors = (colors: Record<string, string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("projectColorsChanged"));
  }
};

export const getProjectColor = (
  colors: Record<string, string>,
  tagId: string,
  fallbackIndex = 0,
) => {
  return colors[tagId] ?? defaultProjectColors[fallbackIndex % defaultProjectColors.length];
};

export const setProjectColor = (colors: Record<string, string>, tagId: string, color: string) => {
  const next = { ...colors, [tagId]: color };
  saveProjectColors(next);
  return next;
};
