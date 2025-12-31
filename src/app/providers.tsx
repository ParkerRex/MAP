"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState, type ReactNode } from "react";

if (isDesktopApp()) {
  require("@/desktop/main");
}

type ProviderProps = {
  children: ReactNode;
};

export function Providers({ children }: ProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
