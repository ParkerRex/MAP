import { goalsDb } from "@/db/goals";
import { notFound } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

export const PUT = withAuth(async (user, request, { params }) => {
  const { goalId } = await params;
  const body = await request.json();
  const { completed, title, dueAt } = body;

  // Handle toggle complete
  if (typeof completed === "boolean") {
    const goal = await goalsDb.toggleGoalComplete(goalId, user.id, completed);
    if (!goal) throw notFound("Goal");
    return { goal };
  }

  // General update
  const goal = await goalsDb.updateGoal(goalId, user.id, {
    title,
    dueAt: dueAt ? new Date(dueAt) : undefined,
  });

  if (!goal) {
    throw notFound("Goal");
  }

  return { goal };
});

export const DELETE = withAuth(async (user, _request, { params }) => {
  const { goalId } = await params;
  const deleted = await goalsDb.deleteGoal(goalId, user.id);

  if (!deleted) {
    throw notFound("Goal");
  }

  return { success: true };
});
