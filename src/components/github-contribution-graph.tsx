"use client";

import { cn } from "@/components/ui/cn";

const GITHUB_GRAPH_BASE_URL = "https://ghchart.rshah.org";
const GITHUB_GRAPH_GREEN = "20b14f";

export function normalizeGithubUsername(username?: string | null) {
  if (!username) return "";
  return username.trim().replace(/^@/, "");
}

export function getGithubGraphUrl(username: string) {
  return `${GITHUB_GRAPH_BASE_URL}/${GITHUB_GRAPH_GREEN}/${encodeURIComponent(username)}`;
}

interface GitHubContributionGraphProps {
  username: string;
  className?: string;
}

export function GitHubContributionGraph({ username, className }: GitHubContributionGraphProps) {
  const normalized = normalizeGithubUsername(username);
  if (!normalized) return null;

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">GitHub contributions</p>
          <p className="text-xs text-muted-foreground">@{normalized}</p>
        </div>
        <a
          href={`https://github.com/${normalized}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View profile
        </a>
      </div>
      <div className="mt-3 overflow-x-auto">
        <img
          src={getGithubGraphUrl(normalized)}
          alt={`GitHub contributions for ${normalized}`}
          className="block h-auto min-w-[640px] max-w-none"
          loading="lazy"
        />
      </div>
    </div>
  );
}
