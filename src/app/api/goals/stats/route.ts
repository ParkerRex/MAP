import { NextResponse } from "next/server";
import { goalsDb } from "@/db/goals";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await goalsDb.getCompletionStats(user.id);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Failed to fetch goal stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal stats" },
      { status: 500 },
    );
  }
}
