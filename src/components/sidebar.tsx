"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  RiCalendarLine,
  RiCheckboxLine,
  RiFileTextLine,
  RiHeartLine,
  RiLogoutBoxRLine,
  RiSettings4Line,
  RiUserLine,
} from "react-icons/ri";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "./ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Icons } from "./ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const navItems = [
  { href: "/calendar", label: "Calendar", icon: RiCalendarLine },
  { href: "/tasks", label: "Tasks", icon: RiCheckboxLine },
  { href: "/notes", label: "Notes", icon: RiFileTextLine },
  { href: "/health", label: "Health", icon: RiHeartLine },
  { href: "/settings", label: "Settings", icon: RiSettings4Line },
];

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Hide sidebar on auth pages
  const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));
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

        <div className="border-t border-border/50 pt-2">
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full flex-col items-center justify-center gap-[2px] py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <div className="flex h-7 w-7 items-center justify-center">
                      <RiUserLine size={16} />
                    </div>
                    <span>Account</span>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={8}
                className="bg-popover text-popover-foreground border shadow-sm text-sm"
              >
                Account
              </TooltipContent>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user?.displayName ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <RiLogoutBoxRLine className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
}
