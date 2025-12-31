import type { Tag as DrizzleTag, Task as DrizzleTask } from "@/db/schema";

export type Tag = DrizzleTag;

export type Task = DrizzleTask;

export type TaskWithTags = Task & {
  tags: { id: string; title: string }[];
};
