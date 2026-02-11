"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import {
  GitHubContributionGraph,
  normalizeGithubUsername,
} from "@/components/github-contribution-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleStatus } from "@/hooks/use-calendar";
import { useClaudeConnect, useClaudeDisconnect, useClaudeStatus } from "@/hooks/use-claude";
import { useGitHubDisconnect, useGitHubStatus } from "@/hooks/use-github";
import { useOpenAIConnect, useOpenAIDisconnect, useOpenAIStatus } from "@/hooks/use-openai";
import { queryKeys } from "@/lib/api";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <Badge
      variant={connected ? "default" : "secondary"}
      className={connected ? "bg-green-600 hover:bg-green-600" : ""}
    >
      {connected ? "Connected" : "Not connected"}
    </Badge>
  );
}

function APIKeyInput({
  label,
  placeholder,
  value,
  onChange,
  onSave,
  onDisconnect,
  isConnected,
  isSaving,
  isDisconnecting,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
  isSaving: boolean;
  isDisconnecting: boolean;
}) {
  const [showInput, setShowInput] = useState(false);

  if (isConnected && !showInput) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/10">
            <svg
              className="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">{label} API key configured</p>
            <p className="text-xs text-muted-foreground">Your API key is securely stored</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowInput(true)}>
            Update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="text-destructive hover:text-destructive"
          >
            {isDisconnecting ? "Removing..." : "Remove"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={label} className="text-sm">
          API Key
        </Label>
        <div className="flex gap-2">
          <Input
            id={label}
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button onClick={onSave} disabled={!value.trim() || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          {isConnected && (
            <Button variant="ghost" size="icon" onClick={() => setShowInput(false)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, logout, isLoggingOut } = useAuth();
  const queryClient = useQueryClient();
  const { data: googleStatus } = useGoogleStatus();
  const { data: githubStatus, isLoading: isGithubStatusLoading } = useGitHubStatus();
  const { data: claudeStatus } = useClaudeStatus();
  const { data: openaiStatus } = useOpenAIStatus();
  const claudeConnect = useClaudeConnect();
  const claudeDisconnect = useClaudeDisconnect();
  const githubDisconnect = useGitHubDisconnect();
  const openaiConnect = useOpenAIConnect();
  const openaiDisconnect = useOpenAIDisconnect();
  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (user.email?.[0]?.toUpperCase() ?? "U");
  const connectedGithubUsername = normalizeGithubUsername(
    githubStatus?.username ?? user.githubUsername,
  );
  const isGitHubConnected = githubStatus?.connected ?? false;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and integrations</p>
      </div>

      <div className="space-y-8">
        {/* Account Section */}
        <SettingsSection title="Account" description="Your profile linked to Google">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            {user.profilePhotoUrl ? (
              <img
                src={user.profilePhotoUrl}
                alt={user.displayName ?? user.email}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-2 ring-border">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.displayName ?? "Google Account"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
            <ConnectionStatus connected={googleStatus?.connected ?? false} />
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">GitHub</p>
              <p className="text-xs text-muted-foreground">
                Connect GitHub to sync contributions, notifications, and PRs.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-3">
                {githubStatus?.avatarUrl ? (
                  <img
                    src={githubStatus.avatarUrl}
                    alt={connectedGithubUsername || "GitHub"}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-border">
                    GH
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {isGitHubConnected
                      ? connectedGithubUsername
                        ? `@${connectedGithubUsername}`
                        : "GitHub connected"
                      : "Not connected"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isGitHubConnected
                      ? "Your GitHub activity will appear on Home."
                      : "Connect GitHub to show contributions and review requests."}
                  </p>
                </div>
              </div>
              <ConnectionStatus connected={isGitHubConnected} />
            </div>

            <div className="flex flex-wrap gap-2">
              {isGitHubConnected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      queryClient.invalidateQueries({ queryKey: queryKeys.github.all })
                    }
                    disabled={isGithubStatusLoading}
                  >
                    {isGithubStatusLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => githubDisconnect.mutateAsync()}
                    disabled={githubDisconnect.isPending}
                  >
                    {githubDisconnect.isPending ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </>
              ) : (
                <Button asChild size="sm">
                  <a href="/api/github/oauth">Connect GitHub</a>
                </Button>
              )}
            </div>

            {connectedGithubUsername ? (
              <GitHubContributionGraph username={connectedGithubUsername} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Connect GitHub to show your contribution graph.
              </p>
            )}
          </div>
        </SettingsSection>

        <Separator />

        {/* AI Integrations */}
        <SettingsSection
          title="AI Providers"
          description="Connect your API keys to enable AI features. Usage is billed to your account."
        >
          <div className="space-y-4">
            {/* Claude */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <span className="text-sm font-bold text-orange-600">A</span>
                  </div>
                  <span className="font-medium">Anthropic Claude</span>
                </div>
                <ConnectionStatus connected={claudeStatus?.connected ?? false} />
              </div>
              <APIKeyInput
                label="Claude"
                placeholder="sk-ant-..."
                value={claudeKey}
                onChange={setClaudeKey}
                onSave={async () => {
                  await claudeConnect.mutateAsync(claudeKey.trim());
                  setClaudeKey("");
                }}
                onDisconnect={() => claudeDisconnect.mutateAsync()}
                isConnected={claudeStatus?.connected ?? false}
                isSaving={claudeConnect.isPending}
                isDisconnecting={claudeDisconnect.isPending}
              />
            </div>

            {/* OpenAI */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                    <span className="text-sm font-bold text-emerald-600">O</span>
                  </div>
                  <span className="font-medium">OpenAI</span>
                </div>
                <ConnectionStatus connected={openaiStatus?.connected ?? false} />
              </div>
              <APIKeyInput
                label="OpenAI"
                placeholder="sk-..."
                value={openaiKey}
                onChange={setOpenaiKey}
                onSave={async () => {
                  await openaiConnect.mutateAsync(openaiKey.trim());
                  setOpenaiKey("");
                }}
                onDisconnect={() => openaiDisconnect.mutateAsync()}
                isConnected={openaiStatus?.connected ?? false}
                isSaving={openaiConnect.isPending}
                isDisconnecting={openaiDisconnect.isPending}
              />
            </div>
          </div>
        </SettingsSection>

        <Separator />

        {/* Sign Out */}
        <SettingsSection
          title="Sign out"
          description="You can sign back in with Google at any time."
        >
          <Button onClick={logout} disabled={isLoggingOut} variant="destructive">
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </SettingsSection>
      </div>
    </div>
  );
}
