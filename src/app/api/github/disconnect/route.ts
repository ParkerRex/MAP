import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { calendarDb } from "@/db/calendar";
import { users } from "@/db/schema";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    await calendarDb.deleteIntegration(user.id, "GITHUB");

    await db.update(users).set({ githubUsername: null }).where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
