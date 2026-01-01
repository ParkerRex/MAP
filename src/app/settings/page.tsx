"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleStatus } from "@/hooks/use-calendar";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, logout, isLoggingOut } = useAuth();
  const { data: googleStatus } = useGoogleStatus();

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
