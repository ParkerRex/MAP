import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, ScrollRestoration } from "@tanstack/react-router";
import { AppShell } from "../components/start/app-shell";
import type { RouterContext } from "../router-context";
import "../styles/globals.css";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
      <ScrollRestoration />
    </QueryClientProvider>
  );
}
