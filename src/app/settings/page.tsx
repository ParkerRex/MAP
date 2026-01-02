"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useClaudeConnect, useClaudeDisconnect, useClaudeStatus } from "@/hooks/use-claude";
import { useOpenAIConnect, useOpenAIDisconnect, useOpenAIStatus } from "@/hooks/use-openai";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleStatus } from "@/hooks/use-calendar";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, logout, isLoggingOut } = useAuth();
  const { data: googleStatus } = useGoogleStatus();
  const { data: claudeStatus } = useClaudeStatus();
  const { data: openaiStatus } = useOpenAIStatus();
  const claudeConnect = useClaudeConnect();
  const claudeDisconnect = useClaudeDisconnect();
  const openaiConnect = useOpenAIConnect();
  const openaiDisconnect = useOpenAIDisconnect();
  const [claudeKey, setClaudeKey] = React.useState("");
  const [openaiKey, setOpenaiKey] = React.useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading settings...
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
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and connections.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Connected account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your MAP profile is linked to Google.
        </p>

        <div className="mt-4 flex items-center gap-4 rounded-lg border border-border/60 bg-muted/40 p-4">
          {user.profilePhotoUrl ? (
            <img
              src={user.profilePhotoUrl}
              alt={user.displayName ?? user.email}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <p className="text-base font-medium">{user.displayName ?? "Google Account"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            {googleStatus?.connected ? "Calendar connected" : "Calendar not connected"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Claude API key</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your own Anthropic API key to power AI features. Your usage is billed to your
          Anthropic account.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <input
            type="password"
            value={claudeKey}
            onChange={(event) => setClaudeKey(event.target.value)}
            placeholder="sk-ant-..."
            className="h-11 w-full rounded-md border border-border/60 bg-background px-3 text-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={async () => {
                if (!claudeKey.trim()) return;
                await claudeConnect.mutateAsync(claudeKey.trim());
                setClaudeKey("");
              }}
              disabled={claudeConnect.isPending}
            >
              {claudeConnect.isPending ? "Saving..." : "Save API key"}
            </Button>
            <Button
              variant="outline"
              onClick={() => claudeDisconnect.mutateAsync()}
              disabled={!claudeStatus?.connected || claudeDisconnect.isPending}
            >
              Disconnect
            </Button>
            <span className="text-xs text-muted-foreground">
              {claudeStatus?.connected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">OpenAI API key</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your own OpenAI API key to power AI features. Your usage is billed to your OpenAI
          account.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <input
            type="password"
            value={openaiKey}
            onChange={(event) => setOpenaiKey(event.target.value)}
            placeholder="sk-..."
            className="h-11 w-full rounded-md border border-border/60 bg-background px-3 text-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={async () => {
                if (!openaiKey.trim()) return;
                await openaiConnect.mutateAsync(openaiKey.trim());
                setOpenaiKey("");
              }}
              disabled={openaiConnect.isPending}
            >
              {openaiConnect.isPending ? "Saving..." : "Save API key"}
            </Button>
            <Button
              variant="outline"
              onClick={() => openaiDisconnect.mutateAsync()}
              disabled={!openaiStatus?.connected || openaiDisconnect.isPending}
            >
              Disconnect
            </Button>
            <span className="text-xs text-muted-foreground">
              {openaiStatus?.connected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Sign out</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You can sign back in with Google at any time.
        </p>
        <Button
          onClick={logout}
          disabled={isLoggingOut}
          className="mt-4"
          variant="destructive"
        >
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
