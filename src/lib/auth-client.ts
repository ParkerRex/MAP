import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

const serverUrl = import.meta.env.VITE_CONVEX_SITE_URL;

export const authClient = createAuthClient({
  plugins: [
    convexClient({
      serverUrl,
    }),
  ],
});
