import { addDays } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import { goalsDb } from "@/db/goals";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await goalsDb.getGoals(user.id);
    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Failed to fetch goals:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, dueAt } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const goal = await goalsDb.createGoal({
      title,
      dueAt: dueAt ? new Date(dueAt) : addDays(new Date(), 30),
      userId: user.id,
      completed: false,
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Failed to create goal:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await goalsDb.deleteUserGoals(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete goals:", error);
    return NextResponse.json({ error: "Failed to delete goals" }, { status: 500 });
  }
}
