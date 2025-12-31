import type { BadgeProps } from "@/components/ui/badge";
import type { Task } from "@/types";

export function getTaskStatus(task: Task) {
  return task.completed_at ? "Complete" : "Incomplete";
}

export function getStatusBadgeVariant(task: Task): BadgeProps["variant"] {
  return task.completed_at ? "default" : "outline";
}
