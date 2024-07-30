"use client";
import Logo from "@/components/logo";
import { createClient } from "@map/supabase/client";
import { Button, buttonVariants } from "@map/ui/button";
import { cn } from "@map/ui/cn";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import type { User } from "@supabase/supabase-js";
import { CircleUser } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@map/ui/dropdown-menu";

function AppNavBar({
  link,
}: {
  link?: string;
}) {
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    fetchUser();
  }, []);

  return (
    <>
      <DesktopNavbar link={link} user={user} />
    </>
  );
}

const items = [
  {
    label: "Home",
    link: "/home",
  },
  {
    label: "Calendar",
    link: "/calendar",
  },
  {
    label: "Tasks",
    link: "/lists",
  },
  {
    label: "Notes",
    link: "/notes",
  },
  {
    label: "Health",
    link: "/health",
  },

  {
    label: "Chats",
    link: "/chats",
  },
];

function DesktopNavbar({
  link,
  clickCallback,
  user,
}: {
  link?: string;
  clickCallback?: () => void;
  user: User | null;
}) {
  const pathname = usePathname();
  const isActive = pathname === link;

  return (
    <div className="border-separate border-b bg-background md:flex w-full overflow-x-hidden">
      <nav className="flex w-full items-center justify-between">
        <div className="flex h-[48px] items-center overflow-x-hidden">
          <Link
            href="/"
            className={cn(
              buttonVariants({
                variant: "ghost",
              }),
              "w-full justify-start text-sm text-muted-foreground hover:text-foreground",
              isActive && "text-foreground",
            )}
            onClick={() => {
              if (clickCallback) clickCallback();
            }}
          >
            <Logo />
          </Link>
          <div className="hidden md:flex">
            {items.map((item) => (
              <NavbarItem
                key={item.label}
                link={item.link}
                label={item.label}
              />
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {!user && (
            <Button variant="secondary">
              <Link href="/blog">Read the Blog</Link>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full p-0"
                >
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <Link href="/account">My Account</Link>
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={async () => {
                    const { error } = await createClient().auth.signOut();
                    if (error) {
                      console.error("Logout failed:", error.message);
                    } else {
                      window.location.href = "/";
                    }
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavbarItem({
  link,
  label,
  clickCallback,
}: {
  link: string;
  label: string;
  clickCallback?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === link;

  return (
    <div className="flex flex-row items-center">
      <Link
        href={link}
        className={cn(
          buttonVariants({
            variant: "ghost",
          }),
          "w-full justify-start text-sm text-muted-foreground hover:text-foreground",
          isActive && "text-foreground",
        )}
        onClick={() => {
          if (clickCallback) clickCallback();
        }}
      >
        {label}
      </Link>
    </div>
  );
}

export default AppNavBar;
