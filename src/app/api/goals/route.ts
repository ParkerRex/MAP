import { addDays } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import { goalsDb } from "@/db/goals";
import {
  handleApiError,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const goals = await goalsDb.getGoals(user.id);
    return NextResponse.json({ goals });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const body = await request.json();
    const { title, dueAt } = body;

    if (!title) {
      throw validationError("Title is required");
    }

    const goal = await goalsDb.createGoal({
      title,
      dueAt: dueAt ? new Date(dueAt) : addDays(new Date(), 30),
      userId: user.id,
      completed: false,
    });

    return NextResponse.json({ goal });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    await goalsDb.deleteUserGoals(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
