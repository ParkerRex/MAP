"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";

type Props = {
  ascending: boolean;
};

export function InboxOrdering({ ascending: initialAscending }: Props) {
  const [ascending, setAscending] = useState(initialAscending);

  const handleOrderChange = (newAscending: boolean) => {
    setAscending(newAscending);
    // Cookie will be set by the parent component or via API
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Sort size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          checked={!ascending}
          onCheckedChange={() => handleOrderChange(false)}
        >
          Most recent
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={ascending}
          onCheckedChange={() => handleOrderChange(true)}
        >
          Oldest first
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
