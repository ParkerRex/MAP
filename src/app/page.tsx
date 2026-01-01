"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect authenticated users to calendar (dashboard)
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/calendar");
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <Icons.Logo className="h-8 w-auto opacity-50" />
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="fixed left-0 right-0 top-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/">
              <Icons.Logo className="h-6 w-auto" />
            </Link>
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
              Your health,
              <br />
              mapped beautifully.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Set goals, track progress, and boost your health and happiness with AI-powered
              insights from your calendar, WHOOP, and Apple Health data.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/login">Get started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <a href="https://mapthemap.com">Learn more</a>
              </Button>
            </div>
          </div>
        </main>

        <footer className="border-t py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
            <p>&copy; {new Date().getFullYear()} MAP. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="https://mapthemap.com/terms" className="hover:underline">
                Terms
              </a>
              <a href="https://mapthemap.com/policy" className="hover:underline">
                Privacy
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // User is authenticated, will redirect (show loading in meantime)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse">
        <Icons.Logo className="h-8 w-auto opacity-50" />
      </div>
    </div>
  );
}
