import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, ScrollRestoration } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { RouterContext } from "../router-context";
import { AppShell } from "../components/start/app-shell";
import { authClient } from "../lib/auth-client";
import { getToken } from "../lib/auth-server";
import "../styles/globals.css";

const getAuthToken = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    return {
      initialAuthToken: await getAuthToken(),
    };
  },
  component: RootComponent,
});

function RootComponent() {
  const { queryClient, convexClient } = Route.useRouterContext();
  const { initialAuthToken } = Route.useRouteContext();

  return (
    <ConvexBetterAuthProvider
      client={convexClient}
      authClient={authClient}
      initialToken={initialAuthToken ?? undefined}
    >
      <QueryClientProvider client={queryClient}>
        <AppShell>
          <Outlet />
        </AppShell>
      </QueryClientProvider>
      <ScrollRestoration />
    </ConvexBetterAuthProvider>
  );
}
