"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RiLogoutBoxRLine, RiSettings4Line } from "react-icons/ri";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Icons } from "./ui/icons";

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const hiddenRoutes = ["/", "/login", "/signup", "/auth/error"];
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header
      className={`flex items-center justify-between bg-white dark:bg-gray-800 shadow-xs py-4 px-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Icons.LogoSmall className="h-5 w-5" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">MAP</span>
        </Link>
        <span className="hidden text-sm text-muted-foreground md:inline">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        {isLoading ? null : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-2 py-1.5 transition hover:bg-muted"
              >
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={user.displayName ?? user.email ?? "Profile"}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </div>
                )}
                <span className="hidden text-sm font-medium text-foreground md:inline">
                  {user.displayName ?? user.email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user.displayName ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <RiSettings4Line className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <RiLogoutBoxRLine className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
};
