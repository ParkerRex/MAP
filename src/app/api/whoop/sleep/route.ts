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
    const includeNaps = searchParams.get("includeNaps") !== "false";

    // Get the latest sleep if no params
    if (!startDate && !endDate && !limit) {
      const latestSleep = await whoopDb.getLatestSleep(user.id);
      return NextResponse.json({ latest: latestSleep });
    }

    const sleeps = await whoopDb.getSleeps(user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      includeNaps,
    });

    return NextResponse.json({ sleeps });
  } catch (error) {
    return handleApiError(error);
  }
}
