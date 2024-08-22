"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { TriggerProvider } from "@trigger.dev/react";
import type { ReactNode } from "react";

if (isDesktopApp()) {
  require("@/desktop/main");
}

type ProviderProps = {
  children: ReactNode;
};

export function Providers({ children }: ProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
