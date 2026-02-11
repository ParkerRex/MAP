import { notifyManager, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { startTransition } from "react";
import type { RouterContext } from "./router-context";
import { routeTree } from "./routeTree.gen";

notifyManager.setScheduler((callback) => {
  startTransition(callback);
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 60_000,
    },
  },
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  } satisfies RouterContext,
  defaultPreload: "intent",
});

const routerWithQuery = routerWithQueryClient(router, queryClient);
setupRouterSsrQueryIntegration({ router: routerWithQuery, queryClient });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof routerWithQuery;
  }
}

export { routerWithQuery as router };
