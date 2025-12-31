import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { whoopDb } from "@/db/whoop";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { revokeWhoopToken } from "@/lib/whoop";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    // Get the integration to revoke the token
    const integration = await calendarDb.getIntegration(user.id, "WHOOP");

    if (integration) {
      // Try to revoke the token at WHOOP (best effort)
      try {
        await revokeWhoopToken(integration.accessToken);
      } catch (revokeError) {
        console.error("Failed to revoke WHOOP token:", revokeError);
        // Continue anyway - we still want to remove the local integration
      }

      // Delete all WHOOP data
      await whoopDb.deleteAllUserData(user.id);

      // Delete the integration from our database
      // We need to add this function to calendarDb
      const { db } = await import("@/db/index");
      const { integrations } = await import("@/db/schema");
      const { and, eq } = await import("drizzle-orm");

      await db
        .delete(integrations)
        .where(
          and(
            eq(integrations.userId, user.id),
            eq(integrations.provider, "WHOOP"),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
