import { addDays } from "date-fns";
import { goalsDb } from "@/db/goals";
import { validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";
import { parseGoalCategory, parseGoalStatus } from "./validation";

const DEFAULT_GOAL_DUE_DAYS = 30;

export const GET = withAuth(async (user) => {
  const goals = await goalsDb.getGoals(user.id);
  return { goals };
});

export const POST = withAuth(async (user, request) => {
  const body = await request.json();
  const { title, dueAt, category, status } = body as {
    title?: string;
    dueAt?: string;
    category?: string;
    status?: string;
  };

  if (!title) {
    throw validationError("Title is required");
  }

  const validCategory = parseGoalCategory(category);
  const validStatus = parseGoalStatus(status);

  const goal = await goalsDb.createGoal({
    title,
    dueAt: dueAt ? new Date(dueAt) : addDays(new Date(), DEFAULT_GOAL_DUE_DAYS),
    userId: user.id,
    completed: false,
    goalCategory: validCategory,
    goalStatus: validStatus,
  });

  return { goal };
});

export const DELETE = withAuth(async (user) => {
  await goalsDb.deleteUserGoals(user.id);
  return { success: true };
});
