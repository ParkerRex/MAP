import { calendarDb } from "@/db/calendar";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_AUTH_BASE = "https://github.com/login/oauth";
const GITHUB_GRAPHQL_BASE = "https://api.github.com/graphql";

export const GITHUB_SCOPES = ["read:user", "notifications", "repo"] as const;

export interface GitHubUser {
  login: string;
  avatar_url: string | null;
  html_url: string | null;
}

export interface GitHubContributionDay {
  date: string;
  contributionCount: number;
  color: string;
  weekday: number;
}

export interface GitHubContributionWeek {
  contributionDays: GitHubContributionDay[];
}

export interface GitHubContributionCalendar {
  totalContributions: number;
  weeks: GitHubContributionWeek[];
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
}

interface GitHubNotification {
  id: string;
  reason: string;
  updated_at: string;
  repository: {
    full_name: string;
    html_url: string;
  };
  subject: {
    title: string;
    url: string | null;
  };
}

interface GitHubSearchResult {
  id: number;
  title: string;
  html_url: string;
  repository_url: string;
  updated_at: string;
  state?: "open" | "closed";
  draft?: boolean;
  pull_request?: {
    url?: string;
  };
}

interface GitHubSearchResponse {
  items: GitHubSearchResult[];
}

export function getGitHubAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GITHUB_SCOPES.join(" "),
    state,
  });

  return `${GITHUB_AUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(code: string, redirectUri: string) {
  const response = await fetch(`${GITHUB_AUTH_BASE}/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange GitHub code: ${error}`);
  }

  return (await response.json()) as GitHubTokenResponse;
}

export async function refreshGitHubToken(refreshToken: string) {
  const response = await fetch(`${GITHUB_AUTH_BASE}/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh GitHub token: ${error}`);
  }

  return (await response.json()) as GitHubTokenResponse;
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await githubRequest<GitHubUser>("/user", accessToken);
  return response;
}

export async function listGitHubNotifications(accessToken: string, limit = 6) {
  const params = new URLSearchParams({
    all: "false",
    per_page: String(limit),
  });
  const response = await githubRequest<GitHubNotification[]>(
    `/notifications?${params.toString()}`,
    accessToken,
  );
  return response;
}

export async function searchGitHubIssues(accessToken: string, query: string, limit = 6) {
  const params = new URLSearchParams({
    q: query,
    per_page: String(limit),
  });
  const response = await githubRequest<GitHubSearchResponse>(
    `/search/issues?${params.toString()}`,
    accessToken,
  );
  return response.items ?? [];
}

export async function fetchGitHubContributionCalendar(
  accessToken: string,
  login: string,
): Promise<GitHubContributionCalendar> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
                weekday
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(GITHUB_GRAPHQL_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "MapAI",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables: { login } }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub GraphQL error (${response.status}): ${error}`);
  }

  const payload = (await response.json()) as {
    data?: {
      user?: {
        contributionsCollection?: {
          contributionCalendar?: GitHubContributionCalendar;
        };
      };
    };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((err) => err.message ?? "Unknown error").join(", "));
  }

  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) {
    throw new Error("GitHub contributions not available");
  }

  return calendar;
}

export async function createGitHubClient(
  userId: string,
  integration: {
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: Date | null;
  },
) {
  let accessToken = integration.accessToken;

  if (integration.expiresAt && integration.refreshToken) {
    const expiresAt = new Date(integration.expiresAt);
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      const refreshed = await refreshGitHubToken(integration.refreshToken);
      accessToken = refreshed.access_token;

      const updatedExpiresAt = refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000)
        : undefined;

      await calendarDb.updateIntegration(userId, "GITHUB", {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? integration.refreshToken ?? undefined,
        expiresAt: updatedExpiresAt,
      });
    }
  }

  return { accessToken };
}

function getRepoFromApiUrl(repositoryUrl: string): string | null {
  const match = repositoryUrl.match(/\/repos\/(.+)$/);
  return match ? match[1] : null;
}

function convertNotificationUrl(apiUrl: string, repository?: string | null): string | null {
  try {
    const issueMatch = apiUrl.match(/repos\/([^/]+\/[^/]+)\/issues\/(\d+)/);
    if (issueMatch) {
      const repo = issueMatch[1];
      const number = issueMatch[2];
      return `https://github.com/${repo}/issues/${number}`;
    }

    const prMatch = apiUrl.match(/repos\/([^/]+\/[^/]+)\/pulls\/(\d+)/);
    if (prMatch) {
      const repo = prMatch[1];
      const number = prMatch[2];
      return `https://github.com/${repo}/pull/${number}`;
    }

    if (repository) {
      return `https://github.com/${repository}`;
    }
  } catch {
    // Fall back to repository url
  }

  return repository ? `https://github.com/${repository}` : null;
}

export function mapNotificationsToItems(notifications: GitHubNotification[]) {
  return notifications.map((notification) => ({
    id: notification.id,
    type: "notification" as const,
    title: notification.subject?.title ?? "Notification",
    repository: notification.repository?.full_name ?? null,
    reason: notification.reason,
    url: notification.subject?.url
      ? convertNotificationUrl(notification.subject.url, notification.repository?.full_name)
      : (notification.repository?.html_url ?? null),
    updatedAt: notification.updated_at,
  }));
}

interface GitHubIssueSummary {
  state?: "open" | "closed";
  pull_request?: {
    url?: string;
  };
}

interface GitHubPullRequestSummary {
  state?: "open" | "closed";
  draft?: boolean;
  merged_at?: string | null;
}

function mapIssueStateToItemState(summary?: GitHubPullRequestSummary | GitHubIssueSummary) {
  if (!summary?.state) return null;
  if ("merged_at" in summary && summary.merged_at) {
    return "merged" as const;
  }
  if ("draft" in summary && summary.draft) {
    return "draft" as const;
  }
  return summary.state === "closed" ? ("closed" as const) : ("open" as const);
}

export async function mapNotificationsToItemsWithState(
  notifications: GitHubNotification[],
  accessToken: string,
) {
  const items = await Promise.all(
    notifications.map(async (notification) => {
      let state: "open" | "closed" | "merged" | "draft" | null = null;
      const subjectUrl = notification.subject?.url ?? null;

      if (subjectUrl) {
        try {
          const issueSummary = await githubRequestUrl<GitHubIssueSummary>(subjectUrl, accessToken);
          if (issueSummary.pull_request?.url) {
            try {
              const prSummary = await githubRequestUrl<GitHubPullRequestSummary>(
                issueSummary.pull_request.url,
                accessToken,
              );
              state = mapIssueStateToItemState(prSummary);
            } catch {
              state = mapIssueStateToItemState(issueSummary);
            }
          } else {
            state = mapIssueStateToItemState(issueSummary);
          }
        } catch {
          state = null;
        }
      }

      return {
        id: notification.id,
        type: "notification" as const,
        title: notification.subject?.title ?? "Notification",
        repository: notification.repository?.full_name ?? null,
        reason: notification.reason,
        url: notification.subject?.url
          ? convertNotificationUrl(notification.subject.url, notification.repository?.full_name)
          : (notification.repository?.html_url ?? null),
        updatedAt: notification.updated_at,
        state: state ?? undefined,
      };
    }),
  );

  return items;
}

export function mapSearchResultsToItems(
  results: GitHubSearchResult[],
  type: "pullRequest" | "task",
  reason: string,
) {
  return results.map((result) => ({
    id: String(result.id),
    type,
    title: result.title,
    repository: getRepoFromApiUrl(result.repository_url),
    reason,
    url: result.html_url,
    updatedAt: result.updated_at,
    state:
      result.draft && type === "pullRequest"
        ? ("draft" as const)
        : result.state === "closed"
          ? ("closed" as const)
          : ("open" as const),
  }));
}

async function githubRequest<T>(
  endpoint: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "MapAI",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return (await response.json()) as T;
}

async function githubRequestUrl<T>(
  url: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "MapAI",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return (await response.json()) as T;
}
