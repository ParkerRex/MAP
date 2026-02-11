"use client";

import Link from "next/link";
import {
  RiArrowRightLine,
  RiCalendarLine,
  RiHeartPulseLine,
  RiSparklingLine,
} from "react-icons/ri";
import {
  GitHubContributionGraph,
  normalizeGithubUsername,
} from "@/components/github-contribution-graph";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";

const features = [
  {
    icon: RiCalendarLine,
    title: "Unified Calendar",
    description:
      "All your events from Google Calendar in one beautiful view with week-at-a-glance.",
  },
  {
    icon: RiHeartPulseLine,
    title: "Health Insights",
    description: "Connect WHOOP to track recovery, strain, HRV, and sleep patterns.",
  },
  {
    icon: RiSparklingLine,
    title: "AI Analysis",
    description: "Get personalized insights that connect your health data to your schedule.",
  },
];

const integrations = [
  { name: "Google Calendar", available: true },
  { name: "WHOOP", available: true },
  { name: "Apple Health", available: false, soon: true },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const githubUsername = normalizeGithubUsername(user?.githubUsername);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="animate-pulse">
          <Icons.LogoSmall className="h-8 w-8 text-white" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Background effects */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-emerald-500/8 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center">
                <Icons.Logo className="h-6 w-auto text-white" />
              </Link>
              <Button
                asChild
                variant="ghost"
                className="text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </header>

          {/* Hero */}
          <main className="px-6 pt-32 pb-24">
            <div className="mx-auto max-w-6xl">
              {/* Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Now in beta
                </div>
              </div>

              {/* Headline */}
              <h1 className="mt-8 text-center text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Your health,{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                  mapped.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-zinc-400 sm:text-xl">
                Connect your calendar and wearables to understand how your lifestyle affects your
                performance. Set goals, track progress, and optimize with AI.
              </p>

              {/* CTA */}
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-white px-8 text-zinc-900 hover:bg-zinc-100 sm:w-auto"
                >
                  <Link href="/login" className="flex items-center gap-2">
                    Get started free
                    <RiArrowRightLine className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Integrations */}
              <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
                <span>Works with</span>
                {integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
                  >
                    <span className="text-zinc-300">{integration.name}</span>
                    {integration.soon && <span className="text-xs text-zinc-600">(soon)</span>}
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="mt-32">
                <h2 className="text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
                  Everything you need
                </h2>
                <div className="mt-12 grid gap-8 sm:grid-cols-3">
                  {features.map((feature) => (
                    <div
                      key={feature.title}
                      className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition-colors group-hover:bg-white/10 group-hover:text-white">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-5 text-lg font-medium text-white">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview section */}
              <div className="mt-32">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-1">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10" />
                  <div className="relative rounded-xl bg-zinc-900/80 p-8 sm:p-12">
                    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                      {/* Calendar preview */}
                      <div>
                        <h3 className="text-lg font-medium text-white">Week at a glance</h3>
                        <p className="mt-2 text-sm text-zinc-500">
                          See your full week with all calendars unified. Quickly spot conflicts and
                          gaps.
                        </p>
                        <div className="mt-6 space-y-3">
                          {[
                            { time: "9:00", title: "Team standup", color: "bg-blue-500" },
                            { time: "11:00", title: "Product review", color: "bg-purple-500" },
                            { time: "14:00", title: "Deep work block", color: "bg-emerald-500" },
                          ].map((event) => (
                            <div
                              key={event.time}
                              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
                            >
                              <div className={`h-2 w-2 rounded-full ${event.color}`} />
                              <span className="text-xs text-zinc-500">{event.time}</span>
                              <span className="text-sm text-zinc-300">{event.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Health preview */}
                      <div>
                        <h3 className="text-lg font-medium text-white">Health metrics</h3>
                        <p className="mt-2 text-sm text-zinc-500">
                          Track recovery, strain, and sleep to know when to push and when to rest.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                          {[
                            { label: "Recovery", value: "87%", color: "text-emerald-400" },
                            { label: "Strain", value: "12.4", color: "text-blue-400" },
                            { label: "HRV", value: "68ms", color: "text-purple-400" },
                            { label: "Sleep", value: "7h 42m", color: "text-zinc-300" },
                          ].map((metric) => (
                            <div
                              key={metric.label}
                              className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
                            >
                              <p className="text-xs text-zinc-500">{metric.label}</p>
                              <p className={`mt-1 text-xl font-semibold ${metric.color}`}>
                                {metric.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="mt-32 text-center">
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  Ready to optimize your day?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-zinc-500">
                  Join the beta and start connecting your health data to your calendar.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-8 bg-white px-8 text-zinc-900 hover:bg-zinc-100"
                >
                  <Link href="/login" className="flex items-center gap-2">
                    Get started
                    <RiArrowRightLine className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 py-8">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-600 sm:flex-row">
              <div className="flex items-center gap-2">
                <Icons.LogoSmall className="h-4 w-4" />
                <span>&copy; {new Date().getFullYear()} MAP</span>
              </div>
              <div className="flex gap-6">
                <a
                  href="https://mapthemap.com/terms"
                  className="transition-colors hover:text-zinc-400"
                >
                  Terms
                </a>
                <a
                  href="https://mapthemap.com/policy"
                  className="transition-colors hover:text-zinc-400"
                >
                  Privacy
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-8 pt-3">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user.displayName ? `, ${user.displayName}` : ""}.
        </h1>
        <p className="text-sm text-muted-foreground">
          Your GitHub streak lives here alongside your MAP workspace.
        </p>
      </div>

      {githubUsername ? (
        <GitHubContributionGraph username={githubUsername} />
      ) : (
        <div className="rounded-lg border border-dashed p-6">
          <p className="text-sm font-medium">Add your GitHub username</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect it once to show your contribution graph on Home.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/settings">Set up GitHub</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button asChild variant="outline" className="justify-start">
          <Link href="/calendar">Calendar</Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/tasks">Tasks</Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/notes">Notes</Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/health">Health</Link>
        </Button>
      </div>
    </div>
  );
}
