import type { ReactNode } from "react";
import {
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  Settings,
  StickyNote,
  Target,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const navItems = [
  {
    to: "/",
    label: "Overview",
    caption: "Live day map",
    icon: LayoutDashboard,
  },
  {
    to: "/tasks",
    label: "Tasks",
    caption: "Execution lane",
    icon: ListTodo,
  },
  {
    to: "/notes",
    label: "Notes",
    caption: "Idea vault",
    icon: StickyNote,
  },
  {
    to: "/calendar",
    label: "Calendar",
    caption: "Rhythm + events",
    icon: CalendarDays,
  },
  {
    to: "/health",
    label: "Health",
    caption: "Recovery signal",
    icon: HeartPulse,
  },
  {
    to: "/goals",
    label: "Goals",
    caption: "Momentum check",
    icon: Target,
  },
  {
    to: "/chat",
    label: "AI Chat",
    caption: "Agent copilot",
    icon: MessagesSquare,
  },
  {
    to: "/settings",
    label: "Settings",
    caption: "Identity + sync",
    icon: Settings,
  },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-frame relative min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,248,231,0.9),transparent_55%),radial-gradient(circle_at_90%_10%,rgba(200,235,255,0.7),transparent_45%),radial-gradient(circle_at_10%_80%,rgba(255,220,210,0.6),transparent_50%)]" />
      <div className="relative flex min-h-screen flex-col gap-6 px-4 pb-8 pt-6 md:px-6 lg:flex-row lg:gap-8 lg:px-8">
        <aside className="flex w-full flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:max-w-[260px] lg:rounded-[32px] lg:border lg:border-white/60 lg:bg-white/70 lg:p-6 lg:shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)] lg:backdrop-blur">
          <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start lg:gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Map AI
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Control Room
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Convex live
            </span>
          </div>
          <nav className="grid gap-3 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="group flex items-center gap-3 rounded-2xl border border-transparent bg-white/40 px-4 py-3 transition hover:border-white/60 hover:bg-white/80"
                  activeProps={{
                    className:
                      "border-white/80 bg-white text-slate-900 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]",
                  }}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_10px_30px_-20px_rgba(15,23,42,0.7)] transition group-hover:scale-[1.02]">
                    <Icon size={18} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-slate-500">{item.caption}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="hidden rounded-3xl border border-white/70 bg-white/75 p-4 text-sm text-slate-600 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.45)] backdrop-blur lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Today
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              Deep work sprint
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Protect 2 focus blocks. Hydrate, then ship.
            </p>
          </div>
        </aside>
        <div className="flex flex-1 flex-col gap-6">
          <header className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/70 px-6 py-4 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.4)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Greenfield stack
              </p>
              <p className="text-lg font-semibold text-slate-900">
                Convex + TanStack Start + iOS
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
                Syncing google at launch
              </div>
              <button
                type="button"
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5"
              >
                New capture
              </button>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
