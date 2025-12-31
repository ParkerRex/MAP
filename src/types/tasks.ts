import type { Task as DrizzleTask, Tag as DrizzleTag } from "@/db/schema";

export type Tag = DrizzleTag;

export type Task = DrizzleTask;

export type TaskWithTags = Task & {
  tags: { id: string; title: string }[];
};
