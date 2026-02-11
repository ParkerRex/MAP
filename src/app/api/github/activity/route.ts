import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import {
  createGitHubClient,
  fetchGitHubContributionCalendar,
  getGitHubUser,
  listGitHubNotifications,
  mapNotificationsToItemsWithState,
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
    const searchUserQualifier = "@me";

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
            `is:pr is:open (review-requested:${searchUserQualifier} OR assignee:${searchUserQualifier}) archived:false`,
            4,
          )
        : Promise.resolve([]),
      login
        ? safeSearch(`is:issue is:open assignee:${searchUserQualifier} archived:false`, 4)
        : Promise.resolve([]),
    ]);

    let contributionWeeks: Array<{
      days: { date: string; count: number; color: string; weekday: number }[];
    }> = [];
    let totalContributions: number | null = null;

    if (login) {
      try {
        const calendar = await fetchGitHubContributionCalendar(accessToken, login);
        totalContributions = calendar.totalContributions ?? null;
        contributionWeeks = calendar.weeks.map((week) => ({
          days: week.contributionDays.map((day) => ({
            date: day.date,
            count: day.contributionCount,
            color: day.color,
            weekday: day.weekday,
          })),
        }));
      } catch (calendarError) {
        console.error("GitHub contributions error:", calendarError);
      }
    }

    const notificationItems = await mapNotificationsToItemsWithState(notifications, accessToken);
    const filteredNotificationItems = notificationItems.filter(
      (item) => item.state !== "closed" && item.state !== "merged",
    );

    const actionItems = [
      ...filteredNotificationItems,
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
      contributionWeeks,
      totalContributions,
      actionItems,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
