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
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="animate-pulse">
          <Icons.LogoSmall className="h-8 w-8 text-neutral-900" />
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-neutral-50">
        {/* Header */}
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center">
              <Icons.Logo className="h-6 w-auto text-neutral-900" />
            </Link>
            <Button asChild variant="ghost" className="text-neutral-600 hover:text-neutral-900">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 pt-16">
          <div className="mx-auto max-w-2xl text-center">
            {/* Logo mark */}
            <div className="mb-12">
              <Icons.LogoSmall className="mx-auto h-16 w-16 text-neutral-900" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
              Your health, mapped.
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg leading-relaxed text-neutral-500">
              Set goals, track progress, and understand your health with AI-powered insights from
              your calendar, WHOOP, and Apple Health.
            </p>

            {/* CTA */}
            <div className="mt-12">
              <Button
                asChild
                size="lg"
                className="bg-neutral-900 px-8 text-neutral-50 hover:bg-neutral-800"
              >
                <Link href="/login">Get started</Link>
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-200 py-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-sm text-neutral-400 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} MAP</p>
            <div className="flex gap-6">
              <a
                href="https://mapthemap.com/terms"
                className="transition-colors hover:text-neutral-600"
              >
                Terms
              </a>
              <a
                href="https://mapthemap.com/policy"
                className="transition-colors hover:text-neutral-600"
              >
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="animate-pulse">
        <Icons.LogoSmall className="h-8 w-8 text-neutral-900" />
      </div>
    </div>
  );
}
