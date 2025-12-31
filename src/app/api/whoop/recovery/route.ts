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

    // Get the latest recovery or all recoveries
    if (!startDate && !endDate && !limit) {
      const latestRecovery = await whoopDb.getLatestRecovery(user.id);
      const latestCycle = await whoopDb.getLatestCycle(user.id);
      return NextResponse.json({
        latest: latestRecovery,
        latestCycle,
      });
    }

    const recoveries = await whoopDb.getRecoveries(user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ recoveries });
  } catch (error) {
    return handleApiError(error);
  }
}
