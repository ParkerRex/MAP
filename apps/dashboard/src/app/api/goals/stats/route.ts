import { NextResponse } from "next/server";
import { goalsDb } from "@/db/goals";
import { createClient } from "@/lib/db/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await goalsDb.getCompletionStats(user.id);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Failed to fetch goal stats:", error);
    return NextResponse.json({ error: "Failed to fetch goal stats" }, { status: 500 });
  }
}
