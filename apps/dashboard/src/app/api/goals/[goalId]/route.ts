import { NextRequest, NextResponse } from "next/server";
import { goalsDb } from "@/db/goals";
import { createClient } from "@/lib/db/server";

type Params = Promise<{ goalId: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { goalId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { completed, title, dueAt } = body;

    // Handle toggle complete
    if (typeof completed === "boolean") {
      const goal = await goalsDb.toggleGoalComplete(goalId, completed);
      return NextResponse.json({ goal });
    }

    // General update
    const goal = await goalsDb.updateGoal(goalId, {
      title,
      dueAt: dueAt ? new Date(dueAt) : undefined,
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Failed to update goal:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { goalId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await goalsDb.deleteGoal(goalId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete goal:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
