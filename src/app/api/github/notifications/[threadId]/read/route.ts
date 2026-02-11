import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { createGitHubClient } from "@/lib/github";

export async function POST(_request: Request, { params }: { params: { threadId: string } }) {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    const integration = await calendarDb.getIntegration(user.id, "GITHUB");
    if (!integration) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const { accessToken } = await createGitHubClient(user.id, integration);

    await fetch(`https://api.github.com/notifications/threads/${params.threadId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "MapAI",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${error}`);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
