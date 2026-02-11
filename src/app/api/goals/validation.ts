import type { NewGoal } from "@/db/schema";

type GoalCategory = NonNullable<NewGoal["goalCategory"]>;
type GoalStatus = NonNullable<NewGoal["goalStatus"]>;

const GOAL_CATEGORIES = new Set<GoalCategory>([
  "health",
  "work",
  "personal",
  "family",
  "spiritual",
]);
const GOAL_STATUSES = new Set<GoalStatus>(["pending", "in_progress", "completed"]);

export function parseGoalCategory(value: unknown): GoalCategory | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return GOAL_CATEGORIES.has(value as GoalCategory) ? (value as GoalCategory) : undefined;
}

export function parseGoalStatus(value: unknown): GoalStatus | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return GOAL_STATUSES.has(value as GoalStatus) ? (value as GoalStatus) : undefined;
}
