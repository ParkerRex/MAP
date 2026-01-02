"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiCalendarLine,
  RiCheckboxLine,
  RiFileTextLine,
  RiHeartLine,
  RiSettings4Line,
} from "react-icons/ri";
import { cn } from "./ui/cn";
import { Icons } from "./ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const navItems = [
  { href: "/calendar", label: "Calendar", icon: RiCalendarLine },
  { href: "/tasks", label: "Tasks", icon: RiCheckboxLine },
  { href: "/notes", label: "Notes", icon: RiFileTextLine },
  { href: "/health", label: "Health", icon: RiHeartLine },
  { href: "/settings", label: "Settings", icon: RiSettings4Line },
];

const authRoutes = ["/", "/login", "/signup", "/auth/error"];

export function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on auth pages (exact match for "/" since all paths start with it)
  const isAuthPage = authRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );
  if (isAuthPage) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-[60px] flex-col border-r bg-background py-3 md:flex">
        <Link
          href="/"
          className="flex items-center justify-center pb-3 mb-2 border-b border-border/50"
        >
          <Icons.LogoSmall className="h-5 w-5" />
        </Link>
        <div className="flex flex-1 flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-[2px] py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground",
                      isActive && "text-foreground",
                    )}
                  >
                    <div className="flex h-7 w-7 items-center justify-center">
                      <Icon size={16} />
                    </div>
                    <span>{label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="bg-popover text-popover-foreground border shadow-sm text-sm"
                >
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="border-t border-border/50 pt-2" />
      </nav>
    </TooltipProvider>
  );
}
