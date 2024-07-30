import type { Task } from "@/types";
import type { BadgeProps } from "@map/ui/badge";

export function getTaskStatus(task: Task) {
  return task.completed_at ? "Complete" : "Incomplete";
}

export function getStatusBadgeVariant(task: Task): BadgeProps["variant"] {
  return task.completed_at ? "default" : "outline";
}
