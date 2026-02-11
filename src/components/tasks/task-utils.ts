"use client";

import {
  addDays,
  addWeeks,
  format,
  getDay,
  isToday,
  isTomorrow,
  isWithinInterval,
  isYesterday,
  nextMonday,
  set,
  startOfDay,
} from "date-fns";
import type { Tag, TaskWithTags } from "@/types";

export type QuickAddResult = {
  title: string;
  dueAt: Date | null;
  tagId?: string;
  projectName?: string;
};

type TimeParts = { hour: number; minute: number };

const weekdayTokens: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

export const getStartOfToday = () => startOfDay(new Date());

export const isTaskToday = (date?: Date | null) => !!date && isToday(date);

export const isTaskOverdue = (date?: Date | null) => !!date && date < getStartOfToday();

export const isTaskUpcoming = (date?: Date | null) => {
  if (!date) return false;
  return date >= getStartOfToday() && !isToday(date);
};

export const formatQuickAddDate = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  const formatter = isWithinInterval(date, {
    start: getStartOfToday(),
    end: addDays(getStartOfToday(), 6),
  })
    ? "EEE"
    : "MMM d";
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  const datePart = format(date, formatter);
  if (hasTime) {
    return `${datePart} ${format(date, "h:mm a")}`;
  }
  return datePart;
};

const parseTime = (input: string): { time?: TimeParts; cleaned: string } => {
  const match = input.match(/\b\d{1,2}(?::\d{2})?\s?(am|pm)\b/i);
  if (!match) return { cleaned: input };
  const token = match[0].replace(/\s/g, "");
  const parts = token.split(":");
  const hourPart = parts[0] ?? "0";
  const minutePart = parts.length > 1 ? parts[1].slice(0, 2) : "0";
  const isPM = token.toLowerCase().includes("pm");
  let hour = Math.max(0, Math.min(12, Number.parseInt(hourPart, 10) || 0)) % 12;
  if (isPM) hour += 12;
  const minute = Math.max(0, Math.min(59, Number.parseInt(minutePart, 10) || 0));
  const cleaned = input.replace(new RegExp(match[0], "i"), "").trim();
  return { time: { hour, minute }, cleaned };
};

const parseRelativeDate = (lower: string): Date | null => {
  const daysMatch = lower.match(/in\s+(\d+)\s+days/);
  if (daysMatch?.[1]) {
    return addDays(getStartOfToday(), Number.parseInt(daysMatch[1], 10));
  }
  const weeksMatch = lower.match(/in\s+(\d+)\s+weeks/);
  if (weeksMatch?.[1]) {
    return addWeeks(getStartOfToday(), Number.parseInt(weeksMatch[1], 10));
  }
  return null;
};

const parseWeekday = (lower: string): { date?: Date; token?: string } => {
  for (const [token, weekday] of Object.entries(weekdayTokens)) {
    if (!lower.includes(token)) continue;
    const today = getStartOfToday();
    const current = getDay(today);
    let delta = weekday - current;
    if (delta <= 0) delta += 7;
    return { date: addDays(today, delta), token };
  }
  return {};
};

const parseDueDate = (input: string): { dueAt: Date | null; cleaned: string } => {
  const lower = input.toLowerCase();
  const tokens: Array<{ token: string; date: () => Date }> = [
    { token: "tomorrow", date: () => addDays(getStartOfToday(), 1) },
    { token: "today", date: () => getStartOfToday() },
    { token: "next week", date: () => nextMonday(getStartOfToday()) },
  ];
  const simpleMatch = tokens.find((token) => lower.includes(token.token));
  if (simpleMatch) {
    return {
      dueAt: simpleMatch.date(),
      cleaned: input.replace(new RegExp(simpleMatch.token, "i"), "").trim(),
    };
  }

  const relative = parseRelativeDate(lower);
  if (relative) {
    const cleaned = input.replace(/in\s+\d+\s+(days|weeks)/i, "").trim();
    return { dueAt: relative, cleaned };
  }

  const weekday = parseWeekday(lower);
  if (weekday.date && weekday.token) {
    const cleaned = input.replace(new RegExp(weekday.token, "i"), "").trim();
    return { dueAt: weekday.date, cleaned };
  }

  return { dueAt: null, cleaned: input };
};

const parseProjectToken = (input: string, tags: Tag[]) => {
  const match = input.match(/(^|\s)[#@]([\w-]+)/);
  if (!match) return { tagId: undefined, projectName: undefined, cleaned: input };
  const token = match[0];
  const name = match[2] ?? "";
  const existing = tags.find((tag) => tag.title.toLowerCase() === name.toLowerCase());
  const cleaned = input.replace(token, "").trim();
  return { tagId: existing?.id, projectName: name || undefined, cleaned };
};

export const parseQuickAdd = (input: string, tags: Tag[]): QuickAddResult => {
  let working = input;
  const dueParse = parseDueDate(working);
  working = dueParse.cleaned;
  const timeParse = parseTime(working);
  working = timeParse.cleaned;
  const projectParse = parseProjectToken(working, tags);
  working = projectParse.cleaned;

  const title = working.trim() || input.trim();
  let dueAt = dueParse.dueAt;
  if (dueAt && timeParse.time) {
    dueAt = set(dueAt, { hour: timeParse.time.hour, minute: timeParse.time.minute });
  }

  return {
    title,
    dueAt,
    tagId: projectParse.tagId,
    projectName: projectParse.projectName,
  };
};

export const quickAddSummary = (result: QuickAddResult, tags: Tag[]): string[] | null => {
  if (!result.title.trim()) return null;
  const tokens: string[] = [];
  if (result.dueAt) {
    tokens.push(`Due ${formatQuickAddDate(result.dueAt)}`);
  }
  if (result.tagId) {
    const tag = tags.find((t) => t.id === result.tagId);
    if (tag) tokens.push(tag.title);
  } else if (result.projectName) {
    tokens.push(result.projectName);
  }
  return tokens.length ? tokens : null;
};

export const getTaskProjectTitle = (task: TaskWithTags) => task.tags?.[0]?.title ?? null;

export const getTaskDueLabel = (task: TaskWithTags) => {
  const dueAt = task.dueAt ? new Date(task.dueAt) : null;
  if (!dueAt || Number.isNaN(dueAt.getTime())) return null;
  if (task.completedAt) {
    return { text: format(dueAt, "MMM d"), tone: "muted" as const };
  }
  if (isTaskOverdue(dueAt)) {
    return { text: "Overdue", tone: "overdue" as const };
  }
  if (isToday(dueAt)) {
    return { text: "Today", tone: "today" as const };
  }
  if (isTomorrow(dueAt)) {
    return { text: "Tomorrow", tone: "soon" as const };
  }
  if (isYesterday(dueAt)) {
    return { text: "Yesterday", tone: "overdue" as const };
  }
  return { text: format(dueAt, "MMM d"), tone: "soon" as const };
};
