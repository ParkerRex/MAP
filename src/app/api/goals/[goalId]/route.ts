import { type NextRequest, NextResponse } from "next/server";
import { goalsDb } from "@/db/goals";
import { handleApiError, notFound, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

type Params = Promise<{ goalId: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { goalId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const body = await request.json();
    const { completed, title, dueAt } = body;

    // Handle toggle complete
    if (typeof completed === "boolean") {
      const goal = await goalsDb.toggleGoalComplete(goalId, user.id, completed);
      if (!goal) {
        throw notFound("Goal");
      }
      return NextResponse.json({ goal });
    }

    // General update
    const goal = await goalsDb.updateGoal(goalId, user.id, {
      title,
      dueAt: dueAt ? new Date(dueAt) : undefined,
    });

    if (!goal) {
      throw notFound("Goal");
    }

    return NextResponse.json({ goal });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { goalId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const deleted = await goalsDb.deleteGoal(goalId, user.id);

    if (!deleted) {
      throw notFound("Goal");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
