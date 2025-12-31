import type { Tag as DrizzleTag, Task as DrizzleTask } from "@/db/schema";

export type Task = DrizzleTask;
export type Tag = DrizzleTag;

export interface TaskWithTags extends Task {
  tags: { id: string; title: string }[];
}
