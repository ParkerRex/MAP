"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { useState } from "react";

export function ConsentBanner() {
  const [isOpen, setOpen] = useState(true);

  const handleConsent = (accepted: boolean) => {
    // TODO: Implement consent tracking via API route
    console.log("Consent:", accepted);
    setOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed z-50 bottom-2 md:bottom-4 left-2 md:left-4 flex flex-col space-y-4 w-[calc(100vw-16px)] max-w-[420px] border border-border p-4 transition-all bg-background",
        isOpen &&
          "animate-in sm:slide-in-from-bottom-full slide-in-from-bottom-full",
      )}
    >
      <div className="text-sm">
        This site uses tracking technologies. You may opt in or opt out of the
        use of these technologies.
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          className="rounded-full h-8"
          onClick={() => handleConsent(false)}
        >
          Deny
        </Button>
        <Button
          className="rounded-full h-8"
          onClick={() => handleConsent(true)}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
