import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import {
  createGitHubClient,
  getGitHubUser,
  listGitHubNotifications,
  mapNotificationsToItems,
  mapSearchResultsToItems,
  searchGitHubIssues,
} from "@/lib/github";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    const integration = await calendarDb.getIntegration(user.id, "GITHUB");
    if (!integration) {
      return NextResponse.json({ contributionsGraphUrl: null, actionItems: [] });
    }

    const { accessToken } = await createGitHubClient(user.id, integration);
    const githubUser = await getGitHubUser(accessToken);

    const login = githubUser.login;

    const safeSearch = async (query: string, limit: number) => {
      try {
        return await searchGitHubIssues(accessToken, query, limit);
      } catch (searchError) {
        console.error("GitHub search error:", searchError);
        return [];
      }
    };

    const [notifications, pullRequests, issues] = await Promise.all([
      listGitHubNotifications(accessToken, 6),
      login
        ? safeSearch(
            `is:pr is:open (review-requested:${login} OR assignee:${login}) archived:false`,
            4,
          )
        : Promise.resolve([]),
      login
        ? safeSearch(`is:issue is:open assignee:${login} archived:false`, 4)
        : Promise.resolve([]),
    ]);

    const actionItems = [
      ...mapNotificationsToItems(notifications),
      ...mapSearchResultsToItems(pullRequests, "pullRequest", "Review requested"),
      ...mapSearchResultsToItems(issues, "task", "Assigned"),
    ]
      .map((item) => ({
        ...item,
        repository: item.repository ?? undefined,
        reason: item.reason ?? undefined,
        url: item.url ?? undefined,
      }))
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });

    return NextResponse.json({
      contributionsGraphUrl: githubUser.login
        ? `https://github.com/users/${githubUser.login}/contributions`
        : null,
      actionItems,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
