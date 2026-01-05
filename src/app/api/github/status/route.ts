import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { createGitHubClient, getGitHubUser } from "@/lib/github";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    const integration = await calendarDb.getIntegration(user.id, "GITHUB");
    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    try {
      const { accessToken } = await createGitHubClient(user.id, integration);
      const githubUser = await getGitHubUser(accessToken);

      return NextResponse.json({
        connected: true,
        username: githubUser.login ?? null,
        avatarUrl: githubUser.avatar_url ?? null,
        profileUrl: githubUser.html_url ?? null,
        lastSyncAt:
          (integration.updatedAt ?? integration.createdAt)?.toISOString() ?? null,
      });
    } catch (error) {
      console.error("GitHub status error:", error);
      return NextResponse.json({ connected: false });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
