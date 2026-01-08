import { startTransition } from "react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, notifyManager } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexReactClient } from "convex/react";
import { routeTree } from "./routeTree.gen";
import type { RouterContext } from "./router-context";

notifyManager.setScheduler((callback) => {
  startTransition(callback);
});

export const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
export const convexQueryClient = new ConvexQueryClient(convexClient);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 30_000,
    },
  },
});

convexQueryClient.connect(queryClient);

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    convexClient,
    convexQueryClient,
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
