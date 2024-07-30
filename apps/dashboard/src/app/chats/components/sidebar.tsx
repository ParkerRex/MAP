"use client";

import { Avatar, AvatarImage } from "@map/ui/avatar";
import { buttonVariants } from "@map/ui/button";
import { cn } from "@map/ui/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@map/ui/tooltip";
import { MoreHorizontal, SquarePen } from "lucide-react";
import Link from "next/link";
import type { Message } from "./data";

interface SidebarProps {
  links: {
    name: string;
    messages: Message[];
    avatar: string;
    variant: "grey" | "ghost";
  }[];
  onClick?: () => void;
}

export function Sidebar({ links }: SidebarProps) {
  return (
    <div className="relative group flex flex-col h-full gap-4 p-2 bg-background dark:bg-dark-background">
      <div className="flex justify-between p-2 items-center">
        <div className="flex gap-2 items-center text-2xl">
          <p className="font-medium">Chats</p>
          <span className="text-zinc-300">({links.length})</span>
        </div>

        <div>
          <Link
            href="#"
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "h-9 w-9",
            )}
          >
            <MoreHorizontal size={20} />
          </Link>

          <Link
            href="#"
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "h-9 w-9",
            )}
          >
            <SquarePen size={20} />
          </Link>
        </div>
      </div>
      <nav className="grid gap-1 px-2">
        {links.map((link, index) => (
          <Link
            key={index}
            href="#"
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "lg",
              }),
              link.variant === "grey" &&
                "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink",
              "justify-start gap-4",
            )}
          >
            <Avatar className="flex justify-center items-center">
              <AvatarImage
                src={link.avatar}
                alt={link.avatar}
                width={6}
                height={6}
                className="w-10 h-10 "
              />
            </Avatar>
            <div className="flex flex-col max-w-28">
              <span>{link.name}</span>
              {link.messages.length > 0 && (
                <span className="text-zinc-300 text-xs truncate ">
                  {link.messages[link.messages.length - 1].name.split(" ")[0]}:{" "}
                  {link.messages[link.messages.length - 1].message}
                </span>
              )}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
