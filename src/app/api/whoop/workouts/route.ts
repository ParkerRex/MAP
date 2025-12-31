import { type NextRequest, NextResponse } from "next/server";
import { whoopDb } from "@/db/whoop";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");
    const sportId = searchParams.get("sportId");

    const workouts = await whoopDb.getWorkouts(user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sportId: sportId ? parseInt(sportId, 10) : undefined,
    });

    return NextResponse.json({ workouts });
  } catch (error) {
    return handleApiError(error);
  }
}
